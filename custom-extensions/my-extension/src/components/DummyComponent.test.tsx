import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DummyComponent from './DummyComponent';

describe('DummyComponent', () => {
  test('renders with default props', () => {
    render(<DummyComponent />);

    // Check that default title and description are rendered
    expect(screen.getByText('Dummy Component')).toBeInTheDocument();
    expect(screen.getByText('This is a test component for custom extensions')).toBeInTheDocument();

    // Check that buttons are rendered
    expect(screen.getByText('Button 1')).toBeInTheDocument();
    expect(screen.getByText('Button 2')).toBeInTheDocument();

    // Check that the component has the default test ID
    expect(screen.getByTestId('dummy-component')).toBeInTheDocument();
  });

  test('renders with custom props', () => {
    const customTitle = 'Custom Title';
    const customDescription = 'Custom description for testing';
    const customTestId = 'custom-test-id';

    render(
      <DummyComponent title={customTitle} description={customDescription} testId={customTestId} />
    );

    // Check that custom title and description are rendered
    expect(screen.getByText(customTitle)).toBeInTheDocument();
    expect(screen.getByText(customDescription)).toBeInTheDocument();

    // Check that the component has the custom test ID
    expect(screen.getByTestId(customTestId)).toBeInTheDocument();
  });

  test('buttons trigger alerts when clicked', () => {
    // Mock window.alert
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<DummyComponent />);

    // Click Button 1 and check if alert was called with correct message
    fireEvent.click(screen.getByText('Button 1'));
    expect(alertMock).toHaveBeenCalledWith('Button 1 clicked!');

    // Click Button 2 and check if alert was called with correct message
    fireEvent.click(screen.getByText('Button 2'));
    expect(alertMock).toHaveBeenCalledWith('Button 2 clicked!');

    // Restore the original implementation
    alertMock.mockRestore();
  });
});
