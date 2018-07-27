import * as React from 'react';

declare global {
    interface Window { tableau: any; }
}

let dashboard: any;

interface State {
    configured: boolean,
    filters: any[],
    label: string,
    bg: string,
    button: string,
    text: string,
}

class FilterBookmarks extends React.Component<any, State> {
    public readonly state: State = {
        bg: '#ffffff',
        button: '#2DCC97',
        configured: false,
        filters: [],
        label: 'Revert Filters',
        text: '#ffffff',
    };

    constructor(props: any) {
        super(props);
    }

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

    public applyFilters() {
        const filters = JSON.parse(window.tableau.extensions.settings.get('filters'));
        for (const d of filters) {
            if (d.skip === false) {
                switch (d.filterType) {
                    case 'range':
                        let filterOptions = {};
                        if (d.nullOption === 'all-values') {
                            filterOptions = { max: 1, min: 1, nullOption: d.nullOption };
                        } else if (d.dataType === 'date') {
                            filterOptions = { max: new Date(d.max), min: new Date(d.min)};
                        } else {
                            filterOptions = { max: d.max, min: d.min};
                        }
                        dashboard.worksheets.find((ws: any) => ws.name === d.worksheetName).applyRangeFilterAsync(d.fieldName, filterOptions);
                        break;
                    case 'categorical':
                        dashboard.worksheets.find((ws: any) => ws.name === d.worksheetName).applyFilterAsync(d.fieldName, d.appliedValues, d.updateType, { isExcludeMode: d.isExcludeMode });
                        break;
                    default:
                        continue;
                }
            }
        }
    }

    // Pops open the configure page
    public configure() {
        const popupUrl = (window.location.origin.includes('localhost')) ? `${window.location.origin}/#/config` : `${window.location.origin}/extension-filter-bookmarks/#/config`;
        const payload = '';
        window.tableau.extensions.ui.displayDialogAsync(popupUrl, payload, { height: 385, width: 295 }).then(() => {
            // console.log('Configure closed.');
            // console.log(window.tableau.extensions.settings.getAll());
        }).catch((error: any) => {
            switch (error.errorCode) {
                case window.tableau.ErrorCodes.DialogClosedByUser:
                    // tslint:disable-next-line:no-console    
                    console.log('Dialog was closed by user.');
                    break;
                default:
                    // tslint:disable-next-line:no-console
                    console.error(error.message);
            }
        });
    }

    // Update buttons from configuration settings
    public updateSettings(settings: any) {
        // console.log('Update settings!', window.tableau.extensions.settings.getAll())
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
        const initialziePromise = window.tableau.extensions.initializeAsync({ configure: this.configure });
        if (initialziePromise) {
            initialziePromise.then(() => {
                window.tableau.extensions.settings.addEventListener(window.tableau.TableauEventType.SettingsChanged, (settingsEvent: any) => {
                    this.updateSettings(settingsEvent.newSettings)
                });
                dashboard = window.tableau.extensions.dashboardContent.dashboard;
                const configured = (window.tableau.extensions.settings.get('configured') === 'true');
                if (!configured) {
                    window.tableau.extensions.settings.set('filters', JSON.stringify(this.state.filters));
                    window.tableau.extensions.settings.set('bg', this.state.bg);
                    window.tableau.extensions.settings.set('button', this.state.button);
                    window.tableau.extensions.settings.set('text', this.state.text);
                    window.tableau.extensions.settings.set('label', this.state.label);
                    window.tableau.extensions.settings.set('configured', 'true');
                    window.tableau.extensions.settings.saveAsync().then(() => {
                        this.configure();
                    });
                } else {
                    this.updateSettings(window.tableau.extensions.settings.getAll())
                }
          });
        }
    }

    public hexToRgb(hex: string) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            b: parseInt(result[3], 16),
            g: parseInt(result[2], 16),
            r: parseInt(result[1], 16),
        } : null;
    }

    public render() {
        let active = '';
        let color = '';
        const rgb = this.hexToRgb(this.state.button);
        if (rgb){
            active = `rgb(${Math.floor(rgb.r)}, ${Math.floor(rgb.g)}, ${Math.floor(rgb.b)})`;
            color = `rgba(${Math.floor(rgb.r)}, ${Math.floor(rgb.g)}, ${Math.floor(rgb.b)}, .8)`;
        }
        const css = `
            button.button:active {
                background-color: ${active} !important;
            }
        `
      return (
        <div className='outer' style={{backgroundColor: this.state.bg}}>
            <div className='inner'>
            <style>{css}</style>
                <button className='button' onClick={this.applyFilters} style={{backgroundColor: color, color: this.state.text}}>{this.state.label}</button>
            </div>
        </div>
      );
    }
}

export default FilterBookmarks;