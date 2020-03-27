import * as React from 'react';

import { Button, Checkbox, TextField } from '@tableau/tableau-ui';

/* tslint:disable:no-console */

declare global {
    interface Window { tableau: any; }
}

let dashboard: any;

interface State {
    bg: string,
    button: string,
    clear: boolean,
    filters: any,
    label: string,
    saved: boolean,
    text: string,
}

// Container for all configurations
class Configure extends React.Component<any, State> {
    public readonly state: State = {
        bg: '#000000',
        button: '#000000',
        clear: false,
        filters: [],
        label: 'Revert Filters',
        saved: false,
        text: '#000000',
    };

    // Handles change in label input
    public labelChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const text: string = e.target.value;
        this.setState({ label: text });
        try {
            window.tableau.extensions.settings.set('label', text);
            window.tableau.extensions.settings.saveAsync();
        }
        catch (error) {
            console.log(error);
        }
    }

    // Handles change in color input
    public bgChange = (color: any): void => {
        this.setState({ bg: color.target.value });
        window.tableau.extensions.settings.set('bg', color.target.value);
        window.tableau.extensions.settings.saveAsync();
    }

    // Handles change in color input
    public buttonChange = (color: any): void => {
        this.setState({ button: color.target.value });
        window.tableau.extensions.settings.set('button', color.target.value);
        window.tableau.extensions.settings.saveAsync();
    }

    // Handles change in color input
    public textChange = (color: any): void => {
        this.setState({ text: color.target.value });
        window.tableau.extensions.settings.set('text', color.target.value);
        window.tableau.extensions.settings.saveAsync();
    }

    // Handles change in ignoreSelection checkbox
    public clearChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        this.setState({ clear: e.target.checked });
        window.tableau.extensions.settings.set('clear', e.target.checked);
        window.tableau.extensions.settings.saveAsync();
    };

    // Get all filters from all worksheets in dashboard
    public getFilters = (): void => {
        console.log('getting filters')
        const filterFetchPromises: any[] = [];
        const dashboardfilters: any[] = [];
        dashboard.worksheets.forEach((worksheet: any) => {
            filterFetchPromises.push(worksheet.getFiltersAsync());
        });
        Promise.all(filterFetchPromises).then(fetchResults => {
            fetchResults.forEach(filtersForWorksheet => {
                filtersForWorksheet.forEach((filter: any) => {
                    dashboardfilters.push(filter);
                });
            });
            this.constructSettings(dashboardfilters);
        });
    }

    // Settings for range filters
    public constructRangeSetting(filter: any) {
        let skip;
        const min = filter.minValue.value;
        const max = filter.maxValue.value;
        const data = (typeof filter.maxValue.value === 'object' || typeof filter.minValue.value === 'object') ? 'date' : 'number';
        const snullOption = (filter.maxValue.formattedValue === 'Null' && filter.minValue.formattedValue === 'Null') ? 'all-values' : '';
        skip = (filter.minValue.value === undefined || filter.fieldName.startsWith('Action (')) ? true : false;
        return {
            dataType: data,
            fieldName: filter.fieldName,
            filterType: filter.filterType,
            max: (max === 0) ? .0000000000001 : max,
            min: (min === 0) ? .0000000000001 : min,
            nullOption: snullOption,
            skip,
            worksheetName: filter.worksheetName,
        }
    }

    // Settings for categoriacl filters
    public constructCategoricalSetting(filter: any) {
        let skip;
        const values = [];
        for (const v of filter.appliedValues) {
            values.push(v.formattedValue)
        }
        const supdateType = (values.length === 0) ? 'all' : 'replace';
        skip = (filter.fieldName === 'Measure Names' || filter.fieldName.startsWith('Action (')) ? true : false;
        return {
            appliedValues: values,
            fieldName: filter.fieldName,
            filterType: filter.filterType,
            isExcludeMode: filter.isExcludeMode,
            skip,
            updateType: supdateType,
            worksheetName: filter.worksheetName,
        }
    }

    // Transforms filters into settings
    public constructSettings(filters: any) {
        const settings = [];
        for (const f of filters) {
            switch (f.filterType) {
                case 'range':
                    settings.push(this.constructRangeSetting(f));
                    break;
                case 'categorical':
                    settings.push(this.constructCategoricalSetting(f));
                    break;
                default:
                    continue;
            }
        }
        window.tableau.extensions.settings.set('filters_set', 'true');
        window.tableau.extensions.settings.set('filters', JSON.stringify(settings));
        window.tableau.extensions.settings.saveAsync().then(() => {
            // Show/hide "Settings saved!"
            this.setState({ saved: true });
            setTimeout(() => {
                this.setState({ saved: false });
            }, 1000);
        });
    }

    // Saves settings and closes configure dialog with data source payload
    public submit = (): void => {
        const text = (this.state.label || 'Revert Filters');
        window.tableau.extensions.settings.set('label', text);
        window.tableau.extensions.settings.set('configured', 'true');
        window.tableau.extensions.settings.saveAsync().then(() => {
            window.tableau.extensions.ui.closeDialog('closed');
        });
    }

    // Once we have mounted, we call to initialize
    public componentWillMount() {
        window.tableau.extensions.initializeDialogAsync().then(() => {
            dashboard = window.tableau.extensions.dashboardContent.dashboard;
            const settings = window.tableau.extensions.settings.getAll();
            this.setState({
                bg: settings.bg,
                button: settings.button,
                clear: settings.clear === 'true',
                label: settings.label,
                text: settings.text,
            });
            if (settings.configured !== 'true') {
                this.getFilters();
            }
        });
    }

    public render() {
        return (
            <React.Fragment>
                <div className='container'>
                    <div>
                        <div className='header'>
                            Filter Bookmarks Configuration
                            <div className='tooltip'>
                                <svg xmlns='http://www.w3.org/2000/svg' id='Dialogs_x5F_Info' width='15' height='15' viewBox='0 0 15 15'>
                                    <rect id='Line' x='7' y='6' width='1' height='5' fillRule='evenodd' clipRule='evenodd' fill='#666766' />
                                    <rect id='Dot_2_' x='7' y='4' width='1' height='1' fillRule='evenodd' clipRule='evenodd' fill='#666766' />
                                    <path id='Circle' d='M7.5,1C3.9,1,1,3.9,1,7.5S3.9,14,7.5,14 S14,11.1,14,7.5S11.1,1,7.5,1z M7.5,13C4.5,13,2,10.5,2,7.5C2,4.5,4.5,2,7.5,2S13,4.5,13,7.5C13,10.5,10.5,13,7.5,13z' fillRule='evenodd' clipRule='evenodd' fill='#666766' />
                                </svg>
                                <span className='tooltiptext'>
                                    <b>How to Use</b>
                                    <ol>
                                        <li>Set your dashboard filters they way you want to be able to revert to.</li>
                                        <li>Open the configuration window and click "Save Settings".</li>
                                    </ol>
                                    <p>Optional: Customize your buttons label and colors.</p>
                                    <p>If you simply want to clear all filters with this button, turn on that setting under "Options".</p>
                                    <p>Note: You can add as many instances of this extension as you like!</p>
                                </span>
                            </div>
                        </div>
                        <div>
                            <div className='title' style={{ marginTop: '18px' }}>Button Settings</div>
                            <div className='section'>
                                <TextField className='label-text-field' kind='line' label='Label' onChange={this.labelChange} value={this.state.label} />
                                {this.state.clear ?
                                    <p>Currently clearing all filters.</p> : <p>Click <b>Save Settings</b> to save current filters.</p>}
                                <div className='set'>
                                    <Button onClick={this.getFilters} disabled={this.state.clear}>Save Settings</Button>
                                    <span className={this.state.saved ? 'saved show' : 'saved'}>Settings saved!</span>
                                </div>
                            </div>
                            <div className='title'>Options</div>
                            <div className='section'>
                                <Checkbox checked={this.state.clear} onChange={this.clearChange} style={{ flexGrow: 1 }}>Ignore settings and just clear all filters</Checkbox>
                            </div>
                            <div className='title'>Formatting</div>
                            <div className='section'>
                                <div className='format'>
                                    <div className='ftext'>Background Color</div>
                                    <div>
                                        <input type='color' value={this.state.bg} onChange={this.bgChange} style={{ backgroundColor: this.state.bg }} />
                                    </div>
                                </div>
                                <div className='format'>
                                    <div className='ftext'>Button Color</div>
                                    <div>
                                        <input type='color' value={this.state.button} onChange={this.buttonChange} style={{ backgroundColor: this.state.button }} />
                                    </div>
                                </div>
                                <div className='format'>
                                    <div className='ftext'>Button Text Color</div>
                                    <div>
                                        <input type='color' value={this.state.text} onChange={this.textChange} style={{ backgroundColor: this.state.text }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='footer'>
                        <div className='btncluster'>
                            <Button kind='filledGreen' onClick={this.submit} style={{ marginLeft: '12px' }}>OK</Button>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        );
    }
}

export default Configure;