# My Extension Dummy Components

This directory contains dummy components for testing purposes in the custom-extensions directory.

## DummyComponent

A simple component that can be used to test rendering in custom extensions.

### Props

| Name | Type | Default | Description |
|------|------|---------|-------------|
| title | string | 'Dummy Component' | Title to display |
| description | string | 'This is a test component for custom extensions' | Description text |
| testId | string | 'dummy-component' | Data test ID for testing |

### Usage

```tsx
import DummyComponent from './components/DummyComponent';

// With default props
<DummyComponent />

// With custom props
<DummyComponent
  title="Custom Title"
  description="Custom description"
  testId="custom-test-id"
/>
```

## DummyPanel

A panel component that contains two instances of DummyComponent - one with default props and one with custom props.

### Usage

The DummyPanel is registered in the extension's index.tsx file and should appear in the panel list with the name "Test Panel".

```tsx
// Already registered in index.tsx
// To use it programmatically:
import DummyPanel from './components/DummyPanel';

<DummyPanel />
```

## Testing

To test that the components render properly:

1. Run the OHIF Viewer application
2. Open a study
3. Look for the "Test Panel" icon in the panel list
4. Click on it to open the panel
5. Verify that both dummy components are rendered correctly
