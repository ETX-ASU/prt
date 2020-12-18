import {applyMiddleware, combineReducers, compose, createStore} from "redux";
import appReducer from "./store/appReducer";
import thunk from 'redux-thunk';

const rootReducer = combineReducers({
    app: appReducer
  }
);

const storeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export default createStore(rootReducer, storeEnhancers(applyMiddleware(thunk)));