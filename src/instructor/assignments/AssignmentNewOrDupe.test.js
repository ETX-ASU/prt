import React from 'react';
import { render } from '@testing-library/react';

import AssignmentNewOrDupe from './AssignmentNewOrDupe';
import {Provider} from "react-redux";
import store from "./combinedStore";

it('Mounts the App component without errors', () => {
  const { getByText } = render(
    <Provider store={store}>
      <AssignmentNewOrDupe />
    </Provider>
  );

  expect(getByText).toBeInTheDocument();
});
