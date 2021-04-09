import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import ReactDOM from 'react-dom';
import './index.css';
import App from './app/App';
// import SelectionTool from './instructor/lmsLinkage/SelectionDashboard';
import * as serviceWorker from './serviceWorker';
import Amplify from 'aws-amplify';
import config from './aws-exports';
import {BrowserRouter, Switch, Route} from "react-router-dom";
import { Provider } from 'react-redux';
import store from './app/combinedStore';


// THIS SHOULD BE SET TO FALSE FOR LIVE PRODUCTION VERSION
window.isDevMode = false;
window.isMockingFailures = false;

Amplify.configure(config);

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Switch>
          {/*<Route path='/select' component={SelectionTool} />*/}
          <Route path='/' component={App} />
        </Switch>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
