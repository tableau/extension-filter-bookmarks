import * as React from 'react';

/* tslint:disable:no-console */

declare global {
    interface Window { tableau: any; }
}

interface Image {
    name: string;
    ext: string;
    data: string;
}

const defaultImage = {
    name: 'default',
    ext: '.png',
    data: 'iVBORw0KGgoAAAANSUhEUgAAAD4AAAAaCAYAAADv/O9kAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAB3RJTUUH5AMbFhQgjNJxJQAAAPFJREFUWIXtlC8LwlAUR3/+QWEDwTAwiYgIWzKsrwkW04LNYDLbBe1+BIPtZYtV+4JpYYgMk7Bg2kBBNK1NTd47eO98gXMP791bWIT7l59EkAlLM1CULRoA/CRCkXsILlS4bKhw2VDh/8fGqutgQCf8Cu2LlwyMTReibZNqs+D56tUWhOli3eyw6AHmHdf1HoQ5xLxO787BcavAargQZh9TQmsOwlNqcAh3v0xm+sgD/nWL5Y3Wyhoex0dMLicWN0/4PcTo7LGoU2jDnxE2wQE7Umk2hOEeZgGd7Rc5uuq0qHDZUOGyIW+4pRncM5BjaQbeyHkrIkfBCTEAAAAASUVORK5CYII='
}

interface State {
    bg: string,
    button: string,
    clear: boolean,
    configured: boolean,
    filters: any[],
    image: Image,
    label: string,
    style: string,
    text: string,
    useSelectedWS: boolean,
    selectWSList: string[]
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
        image: { name: '', ext: '', data: '' },
        label: 'Revert Filters',
        style: 'text',
        text: '#ffffff',
        useSelectedWS: false,
        selectWSList: []
    };

    // Clears all filters on a dashboard
    public clearFilters() {
        const dashboard = window.tableau.extensions.dashboardContent.dashboard;
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
        const dashboard = window.tableau.extensions.dashboardContent.dashboard;
        const settings = window.tableau.extensions.settings.getAll();
        if (settings.clear === 'true') {
            this.clearFilters();
        } else {
            const filters = JSON.parse(settings.filters);
            for (const filter of filters) {
                if (filter.skip === false) {
                    if (!this.state.useSelectedWS || this.state.selectWSList.includes(filter.worksheetName)) {
                        switch (filter.filterType) {
                            case 'range':
                                let filterOptions = {};
                                if (filter.nullOption === 'all-values') {
                                    filterOptions = { nullOption: filter.nullOption };
                                } else if (filter.dataType === 'date') {
                                    filterOptions = { min: filter.min ? new Date(filter.min) : null, max: filter.max ? new Date(filter.max) : null };
                                } else {
                                    filterOptions = { min: filter.min, max: filter.max };
                                }
                                dashboard.worksheets.find((ws: any) => ws.name === filter.worksheetName).applyRangeFilterAsync(filter.fieldName, filterOptions).catch(() => console.log(`Failed to set range filter [${filter.fieldName}] to [${filterOptions}] on worksheet [${filter.worksheetName}]`));
                                break;
                            case 'categorical':
                                dashboard.worksheets.find((ws: any) => ws.name === filter.worksheetName).applyFilterAsync(filter.fieldName, filter.appliedValues, filter.updateType, { isExcludeMode: filter.isExcludeMode }).catch(() => console.log(`Failed to set categorical filter [${filter.fieldName}] to [${filter.appliedValues}] on worksheet [${filter.worksheetName}]`));
                                break;
                            default:
                                continue;
                        }
                    }
                }
            }
        }
    }

    // Pops open the configure page
    public configure() {
        const popupUrl = `${baseURL}/config.html`;
        const payload = '';
        window.tableau.extensions.ui.displayDialogAsync(popupUrl, payload, { height: 540, width: 300 }).catch((error: any) => {
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
        let image = settings.image ? JSON.parse(settings.image) : defaultImage;
        this.setState({
            bg: settings.bg,
            button: settings.button,
            configured: settings.configured === 'true',
            filters: JSON.parse(settings.filters),
            label: settings.label,
            style: settings.style || 'text',
            image,
            text: settings.text,
            useSelectedWS: settings.useSelectedWS === 'true',
            selectWSList: (settings.selectWSList && JSON.parse(settings.selectWSList)) || []
        });
    }

    // Once we have mounted, we call to initialize
    public componentWillMount() {
        window.tableau.extensions.initializeAsync({ configure: this.configure }).then(() => {
            window.tableau.extensions.settings.addEventListener(window.tableau.TableauEventType.SettingsChanged, (settingsEvent: any) => {
                this.updateSettings(settingsEvent.newSettings)
            });
            const settings = window.tableau.extensions.settings.getAll();
            if (settings.configured === 'true') {
                this.updateSettings(window.tableau.extensions.settings.getAll())
            } else {
                window.tableau.extensions.settings.set('bg', this.state.bg);
                window.tableau.extensions.settings.set('button', this.state.button);
                window.tableau.extensions.settings.set('clear', this.state.clear);
                window.tableau.extensions.settings.set('label', this.state.label);
                window.tableau.extensions.settings.set('image', JSON.stringify(this.state.image));
                window.tableau.extensions.settings.set('style', this.state.style);
                window.tableau.extensions.settings.set('text', this.state.text);
                window.tableau.extensions.settings.set('useSelectedWS', this.state.useSelectedWS);
                window.tableau.extensions.settings.set('selectWSList', JSON.stringify(this.state.selectWSList));
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

        const textButton = <button className='button' onClick={this.applyFilters} style={{ backgroundColor: color, color: this.state.text }}>{this.state.label}</button>;

        const imageButton = <img src={this.state.image.data !== '' ? `data:image/png;base64, ${this.state.image.data}` : `data:image/png;base64, ${defaultImage.data}`} style={{ cursor: 'pointer', maxWidth: '100%', objectFit: 'contain' }} onClick={this.applyFilters} alt='Filter' />;

        return (
            <div className='outer' style={{ backgroundColor: this.state.bg, display: this.state.configured ? 'flex' : 'none' }}>
                <div className='inner'>
                    <style>{css}</style>
                    {this.state.style === "image" ? imageButton : textButton}
                </div>
            </div>
        );
    }
}

export default FilterBookmarks;
