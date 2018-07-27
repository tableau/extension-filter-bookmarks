import * as React from 'react';

import {
    ButtonType,
    ButtonWidget,
    LineTextFieldWidget,
} from '@tableau/widgets';

declare global {
    interface Window { tableau: any; }
}

let dashboard: any;

interface State {
    bg: string,
    button: string,
    configured: boolean,
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
        configured: false,
        filters: [],
        label: 'Revert Filters',
        saved: false,
        text: '#000000',
    };

    constructor(props: any) {
        super(props);
        this.labelChange = this.labelChange.bind(this);
        this.bgChange = this.bgChange.bind(this);
        this.buttonChange = this.buttonChange.bind(this);
        this.textChange = this.textChange.bind(this);
        this.submit = this.submit.bind(this);
        this.showSaved = this.showSaved.bind(this);
    }

    // Handles change in label input
    public labelChange(text: string) {
        this.setState({
            label: text,
        });
        window.tableau.extensions.settings.set('label', text);
        window.tableau.extensions.settings.saveAsync();
    }
    
    // Handles change in color input
    public bgChange(color: any) {
        // console.log(`Set background color to ${color}.`);
        this.setState({
            bg: color.target.value,
        });
        window.tableau.extensions.settings.set('bg', color.target.value);
        window.tableau.extensions.settings.saveAsync();
    }

    // Handles change in color input
    public buttonChange(color: any) {
        // console.log(`Set button color to ${color}.`);
        this.setState({
            button: color.target.value,
        });
        window.tableau.extensions.settings.set('button', color.target.value);
        window.tableau.extensions.settings.saveAsync();
    }

    // Handles change in color input
    public textChange(color: any) {
        // console.log(`Set button text color to ${color}.`);
        this.setState({
            text: color.target.value,
        });
        window.tableau.extensions.settings.set('text', color.target.value);
        window.tableau.extensions.settings.saveAsync();
    }

    // Get all filters from all worksheets in dashboard
    public getFilters() {
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
            // console.log(dashboardfilters);
            this.constructSettings(dashboardfilters);
        });
    }

    // Transforms filters into settings
    public constructSettings(filters: any) {
        const settings = [];
        for (const f of filters) {
            let sskip;
            switch (f.filterType) {
                case 'range':
                    const min = f.minValue.value;
                    const max = f.maxValue.value;
                    const data = (typeof f.maxValue.value === 'object' || typeof f.minValue.value === 'object') ? 'date' : 'number';
                    const snullOption = (f.maxValue.formattedValue === 'Null' && f.minValue.formattedValue === 'Null') ? 'all-values' : '';
                    // sskip = (f.minValue.value === undefined || f.minValue.value instanceof Date || f.fieldName.startsWith('Action (')) ? true : false;
                    sskip = (f.minValue.value === undefined || f.fieldName.startsWith('Action (')) ? true : false;
                    settings.push({
                        dataType: data,
                        fieldName: f.fieldName,
                        filterType: f.filterType,
                        max: (max === 0) ? .0000000000001 : max,
                        min: (min === 0) ? .0000000000001 : min,
                        nullOption: snullOption,
                        skip: sskip,
                        worksheetName: f.worksheetName,
                    });
                    break;
                case 'categorical':
                    const values = [];
                    for (const v of f.appliedValues) {
                        values.push(v.formattedValue)
                    }
                    const supdateType = (values.length === 0) ? 'all' : 'replace';
                    sskip = (f.fieldName === 'Measure Names' || f.fieldName.startsWith('Action (')) ? true : false; 
                    settings.push({
                        appliedValues: values,
                        fieldName: f.fieldName,
                        filterType: f.filterType,
                        isExcludeMode: f.isExcludeMode,
                        skip: sskip,
                        updateType: supdateType,
                        worksheetName: f.worksheetName,
                    });
                    break;
                default:
                    continue;
            }
        }
        window.tableau.extensions.settings.set('filters_set', 'true');
        window.tableau.extensions.settings.set('filters', JSON.stringify(settings));
        window.tableau.extensions.settings.saveAsync();
    }
    
    // Saves settings and closes configure dialog with data source payload
    public submit() {
        const text = (this.state.label || 'Revert Filters');
        window.tableau.extensions.settings.set('label', text);
        window.tableau.extensions.settings.saveAsync();
        window.tableau.extensions.ui.closeDialog('closed');
    }

    public showSaved() {
        this.getFilters();
        this.setState({
            saved: true,
        });
        setTimeout(() => {
            this.setState({
                saved: false,
            });
        }, 1000);
    }

    // Once we have mounted, we call to initialize
    public componentWillMount() {
        const uiPromise = window.tableau.extensions.initializeDialogAsync();
        if (uiPromise) {
            uiPromise.then(() => {
                dashboard = window.tableau.extensions.dashboardContent.dashboard;
                const settings = window.tableau.extensions.settings.getAll();
                this.setState({
                    bg: settings.bg,
                    button: settings.button,
                    configured: settings.configured === 'true',
                    filters: JSON.parse(settings.filters),
                    label: settings.label,
                    text: settings.text,
                });
                this.getFilters();
            });
        } else {
            // tslint:disable-next-line:no-console
            console.log('Not running inside of window.tableau');
        }
    }

    public slabelChange: (value: any) => void = value => this.labelChange(value);
    public sbgChange: (value: any) => void = value => this.bgChange(value);
    public sbuttonChange: (value: any) => void = value => this.buttonChange(value);
    public stextChange: (value: any) => void = value => this.textChange(value);

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
                                <li>Optional: Customize your buttons label and colors.</li>
                                <li>Note: You can add as many instances of this extension as you like!</li>
                            </ol>
                            <p>Note: You can add as many instances of this extension as you like!</p>
                        </span>
                    </div>
                </div>
                <div>
                    <div className='title'>Button Settings</div>
                    <div className='config'>
                        <LineTextFieldWidget text={this.state.label} handleChange={this.slabelChange} testId='label' floatingLabel='Label'/>
                        <p>Click <b>Save Settings</b> to save current filters.</p>
                        <div className='set'><ButtonWidget buttonType={ButtonType.Outline} handleClick={this.showSaved} testId='set-filters'>Save Settings</ButtonWidget><span className={this.state.saved ? 'saved show' : 'saved'}>Settings saved!</span></div>
                        
                    </div>
                    <div className='title'>Formatting</div>
                    <div className='formatting'>
                        <div className='format'>
                            <div className='ftext'>Background Color</div>
                            <div>
                            <input type='color' defaultValue={this.state.bg} onChange={this.sbgChange} style={{backgroundColor: this.state.bg}}/>
                            </div>
                        </div>
                        <div className='format'>
                            <div className='ftext'>Button Color</div>
                            <div>
                            <input type='color' defaultValue={this.state.button} onChange={this.sbuttonChange} style={{backgroundColor: this.state.button}}/>
                            </div>
                        </div>
                        <div className='format'>
                            <div className='ftext'>Button Text Color</div>
                            <div>
                            <input type='color' defaultValue={this.state.text} onChange={this.stextChange} style={{backgroundColor: this.state.text}}/>
                            </div>
                        </div>
                    </div>>
                </div>
            </div>
            <div className='footer'>
                <div className='btncluster'>
                <ButtonWidget buttonType={ButtonType.Go} handleClick={this.submit} testId='ok' style={{marginLeft: '12px'}}>OK</ButtonWidget>
                </div>
            </div>
        </div>
    </React.Fragment>
      );
    }
}

export default Configure;