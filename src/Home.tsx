import * as React from 'react';
import './home.css';

class Home extends React.Component<any, any> {
	public render() {
		return (
			<React.Fragment>
				<div className='icontainer'>
					<div className='box'>
						<div className='left'>
							<h1 className='iheader'>Filter Bookmarks</h1>
							<span className='tagline'>Instantly revert your dashboards to predefined filter settings.</span>
						</div>
						<div className='right'>
							<h4 className='big'>What is it?</h4>
							<p>This extension enables you to add a button directly into your dashboard that resets to certain filter settings. Great for embedded dashboards that do not have the toolbar showing or for a more intuitive interface.</p>
							<h4 className='big'>Using the Extension</h4>
							<ol>
								<li>Set your dashboard filters they way you want to be able to revert to.</li>
								<li>Open the configuration window and click "Save Settings".</li>
								<li>Optional: Customize your buttons label and colors.</li>
							</ol>
							<p><b>Note:</b> You can add as many instances of this extension as you like!</p>
							<div className='gh'>
							Get this extension and more in the <a href='https://extensiongallery.tableau.com/'>Extension Gallery</a>.
								{/* <a href='https://github.com/tableau/extension-filter-bookmarks'>View on GitHub</a> */}
							</div>
						</div>
					</div>
				</div>
			</React.Fragment>
		);
	}
}

export default Home;