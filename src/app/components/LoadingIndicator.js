import React from 'react';
import "./loader.css";

function LoadingIndicator(props) {
	return (
		<div className='loading-indicator pt-4 w-100'>
			<div className={`lds-spinner ${props.isDarkSpinner ? 'dark' : ''}`}>
        {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => ( <div key={i}/> ))}
			</div>
			<div className={`loading-msg text-center ${props.msgClasses}`}>
				{props.loadingMsg}
			</div>
		</div>
	)
}

export default LoadingIndicator;