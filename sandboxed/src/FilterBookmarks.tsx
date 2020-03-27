import * as React from 'react';

/* tslint:disable:no-console */

declare global {
    interface Window { tableau: any; }
}

let dashboard: any;

interface State {
    bg: string,
    button: string,
    clear: boolean,
    configured: boolean,
    filters: any[],
    label: string,
    text: string,
}

// Switches base URL based on where extension is being hosted
const baseURL: string = window.location.origin.includes('localhost:3000') ? window.location.origin : '.';

function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        b: parseInt(result[3], 16),
        g: parseInt(result[2], 16),
        r: parseInt(result[1], 16),
    } : null;
}

class FilterBookmarks extends React.Component<any, State> {
    public readonly state: State = {
        bg: '#ffffff',
        button: '#2DCC97',
        clear: false,
        configured: false,
        filters: [],
        label: 'Revert Filters',
        text: '#ffffff',
    };

    // Clears all filters on a dashboard
    public clearFilters() {
        dashboard.worksheets.forEach((worksheet: any) => {
            worksheet.getFiltersAsync().then((filtersForWorksheet: any) => {
                const filterClearPromises: any[] = [];
                filtersForWorksheet.forEach((filter: any) => {
                    filterClearPromises.push(worksheet.clearFilterAsync(filter.fieldName));
                });
            });
        });
    }

    // Apply the filters set in settings
    public applyFilters = (): void => {
        const settings = window.tableau.extensions.settings.getAll();
        if (settings.clear === 'true') {
            this.clearFilters();
        } else {
            const filters = JSON.parse(settings.filters);
            for (const filter of filters) {
                if (filter.skip === false) {
                    switch (filter.filterType) {
                        case 'range':
                            let filterOptions = {};
                            if (filter.nullOption === 'all-values') {
                                filterOptions = { nullOption: filter.nullOption };
                            } else if (filter.dataType === 'date') {
                                filterOptions = { min: new Date(filter.min), max: new Date(filter.max) };
                            } else {
                                filterOptions = { min: filter.min, max: filter.max };
                            }
                            dashboard.worksheets.find((ws: any) => ws.name === filter.worksheetName).applyRangeFilterAsync(filter.fieldName, filterOptions).catch(console.log);
                            break;
                        case 'categorical':
                            dashboard.worksheets.find((ws: any) => ws.name === filter.worksheetName).applyFilterAsync(filter.fieldName, filter.appliedValues, filter.updateType, { isExcludeMode: filter.isExcludeMode }).catch(console.log);
                            break;
                        default:
                            continue;
                    }
                }
            }
        }
    }

    // Pops open the configure page
    public configure() {
        const popupUrl = `${baseURL}/config.html`;
        const payload = '';
        window.tableau.extensions.ui.displayDialogAsync(popupUrl, payload, { height: 470, width: 295 }).catch((error: any) => {
            switch (error.errorCode) {
                case window.tableau.ErrorCodes.DialogClosedByUser:
                    console.log('Dialog was closed by user.');
                    break;
                default:
                    console.error(error.message);
            }
        });
    }

    // Update buttons from configuration settings
    public updateSettings(settings: any) {
        this.setState({
            bg: settings.bg,
            button: settings.button,
            configured: settings.configured === 'true',
            filters: JSON.parse(settings.filters),
            label: settings.label,
            text: settings.text,
        });
    }

    // Once we have mounted, we call to initialize
    public componentWillMount() {
        window.tableau.extensions.initializeAsync({ configure: this.configure }).then(() => {
            window.tableau.extensions.settings.addEventListener(window.tableau.TableauEventType.SettingsChanged, (settingsEvent: any) => {
                this.updateSettings(settingsEvent.newSettings)
            });
            dashboard = window.tableau.extensions.dashboardContent.dashboard;
            const settings = window.tableau.extensions.settings.getAll();
            if (settings.configured === 'true') {
                this.updateSettings(window.tableau.extensions.settings.getAll())
            } else {
                window.tableau.extensions.settings.set('bg', this.state.bg);
                window.tableau.extensions.settings.set('button', this.state.button);
                window.tableau.extensions.settings.set('clear', this.state.clear);
                window.tableau.extensions.settings.set('label', this.state.label);
                window.tableau.extensions.settings.set('text', this.state.text);
                window.tableau.extensions.settings.saveAsync().then(() => {
                    this.configure();
                });
            }
        });
    }

    public render() {
        let active = '';
        let color = '';
        const rgb = hexToRgb(this.state.button);
        if (rgb) {
            active = `rgb(${Math.floor(rgb.r)}, ${Math.floor(rgb.g)}, ${Math.floor(rgb.b)})`;
            color = `rgba(${Math.floor(rgb.r)}, ${Math.floor(rgb.g)}, ${Math.floor(rgb.b)}, .8)`;
        }
        const css = `
            button.button:active {
                background-color: ${active} !important;
            }
        `
        return (
            <div className='outer' style={{ backgroundColor: this.state.bg }}>
                <div className='inner'>
                    <style>{css}</style>
                    <button className='button' onClick={this.applyFilters} style={{ backgroundColor: color, color: this.state.text }}>{this.state.label}</button>
                </div>
            </div>
        );
    }
}

export default FilterBookmarks;
