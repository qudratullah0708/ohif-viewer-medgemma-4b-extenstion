# 🤖 OHIF AI Extension Development Guide

Complete guide for creating a custom OHIF extension with AI chat functionality using Google Gemini API.

## 📋 Table of Contents

1. [Project Setup](#-project-setup)
2. [Extension Creation](#-extension-creation)
3. [Mode Development](#-mode-development)
4. [AI Chat Implementation](#-ai-chat-implementation)
5. [UI Enhancements](#-ui-enhancements)
6. [Configuration & Linking](#-configuration--linking)
7. [Testing & Deployment](#-testing--deployment)
8. [Troubleshooting](#-troubleshooting)

---

## 🚀 Project Setup

### Prerequisites
- Node.js (v16 or higher)
- Yarn package manager
- Git
- Google Gemini API key

### Initial Setup Steps

1. **Fork OHIF Viewer Repository**
   ```bash
   # Fork the repository on GitHub
   # https://github.com/OHIF/Viewers
   ```

2. **Clone the Release Branch**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Viewers.git ohif-viewer-medgemma-4b-extension
   cd ohif-viewer-medgemma-4b-extension
   git checkout release/3.11
   ```

3. **Install Dependencies**
   ```bash
   yarn install
   ```

4. **Verify Installation**
   ```bash
   yarn run dev
   # Should start OHIF viewer on localhost:3000
   ```

---

## 🔧 Extension Creation

### 1. Create Extension Directory

From the project root directory:

```bash
mkdir custom-extensions
```

### 2. Generate Extension Scaffold

**Reference**: Watch the OHIF documentation video for creating extensions

Use OHIF CLI to create extension:
```bash
# From project root (where package.json exists)
yarn run cli create-extension
```

Follow prompts:
- Extension name: `my-extension`
- Location: `custom-extensions/my-extension`

### 3. Extension Structure

The generated extension will have this structure:
```
custom-extensions/my-extension/
├── package.json
├── babel.config.js
├── src/
│   ├── index.tsx           # Main extension entry point
│   ├── components/
│   │   ├── DummyComponent.tsx
│   │   └── DummyPanel.tsx
│   └── README.md
```

### 4. Link Extension

```bash
yarn run cli link-extension "C:\Users\PMLS\Desktop\ohif-viewer-medgemma-4b-extenstion\custom-extensions\my-extension"
```

---

## 🎯 Mode Development

### 1. Create Custom Mode

```bash
# Create mode directory (outside OHIF project)
mkdir C:\Users\PMLS\Desktop\ohif-mode\my-mode
```

### 2. Mode Configuration

Create mode configuration files following OHIF mode structure:
- `package.json`
- `src/index.ts`
- Mode-specific configurations

### 3. Register Mode

Add your mode to OHIF's mode registry for development and testing.

---

## 🤖 AI Chat Implementation

### 1. Core Components

#### DummyPanel.tsx
- Container component for the chat interface
- Handles viewport image capture
- Provides styling and layout

#### DummyComponent.tsx
- Main chat interface implementation
- Google Gemini API integration
- Message handling and state management

### 2. Key Features Implemented

#### Google Gemini Integration
```javascript
// API Configuration
const API_KEY = 'your-gemini-api-key';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
```

#### System Prompt
Comprehensive medical imaging AI assistant prompt with:
- OHIF viewer expertise
- Medical imaging knowledge
- Safety guidelines
- Professional response formatting

#### Image Capture
- Active viewport image extraction
- Base64 encoding for API transmission
- DICOM image analysis capability

### 3. API Integration Details

**Request Structure**:
```javascript
{
  systemInstruction: {
    parts: [{ text: SYSTEM_PROMPT }]
  },
  contents: [{
    parts: [
      { text: userMessage },
      { inlineData: { mimeType: 'image/png', data: base64Image }}
    ]
  }]
}
```

---

## 🎨 UI Enhancements

### 1. Chat Interface Design

#### Message Styling
- **User Messages**: Blue border, right-aligned
- **AI Messages**: Green border, left-aligned
- **Containers**: Rounded corners, shadows, responsive design

#### Visual Elements
- Chat title: "💬 Talk-with-AI"
- Message bubbles with distinct colors
- Loading states and indicators
- Empty state messaging

### 2. Layout Features

```css
/* Key styling approaches */
- Flexbox layout for message alignment
- Max-width constraints (75%) for readability
- Color-coded borders and backgrounds
- Professional typography and spacing
```

#### Color Scheme
- **User**: Blue (`#3b82f6` border, `#eff6ff` background)
- **AI**: Green (`#10b981` border, `#ecfdf5` background)
- **Title**: Blue (`#2563eb` background)

### 3. Interactive Elements

- Text input with Enter key support
- Send button with loading states
- "Use active image" functionality
- Real-time message updates

---

## ⚙️ Configuration & Linking

### 1. Extension Registration

Ensure your extension is properly registered in:
- OHIF extension registry
- Mode configurations
- Build configurations

### 2. Development Workflow

```bash
# Start development server
yarn run dev

# Build extension
yarn run build

# Test extension
yarn run test
```

### 3. Environment Setup

**Required Environment Variables**:
- Google Gemini API key
- OHIF configuration settings

---

## 🧪 Testing & Deployment

### 1. Local Testing

1. Start OHIF viewer: `yarn run dev`
2. Navigate to your mode
3. Open extension panel
4. Test chat functionality
5. Verify image capture works

### 2. Feature Testing Checklist

- [ ] Chat interface loads correctly
- [ ] Messages send and receive properly
- [ ] User/AI message alignment works
- [ ] Image capture functionality
- [ ] API responses are contextual
- [ ] Error handling works
- [ ] UI is responsive

### 3. Production Considerations

- Secure API key storage
- Error boundary implementation
- Performance optimization
- User feedback mechanisms

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Extension Not Loading
```bash
# Verify linking
yarn run cli list-extensions

# Re-link if necessary
yarn run cli link-extension [path]
```

#### 2. API Integration Issues
- Verify API key is valid
- Check CORS settings
- Ensure proper request format

#### 3. Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules
yarn install
yarn run build
```

#### 4. Image Capture Problems
- Verify viewport is active
- Check canvas accessibility
- Ensure proper DICOM loading

### Development Tips

1. **Use Browser DevTools**: Monitor network requests and console logs
2. **Component Debugging**: Add console.log statements for state tracking
3. **API Testing**: Test Gemini API independently before integration
4. **Extension Reload**: Refresh browser after extension changes

---

## 📚 Additional Resources

### OHIF Documentation
- [Extension Development Guide](https://docs.ohif.org/)
- [Mode Creation Tutorial](https://docs.ohif.org/)
- [API Reference](https://docs.ohif.org/)

### Google Gemini API
- [API Documentation](https://ai.google.dev/)
- [Authentication Guide](https://ai.google.dev/)
- [Best Practices](https://ai.google.dev/)

### Development Tools
- React DevTools
- OHIF CLI commands
- Yarn workspace management

---

## 🎯 Extension Features Summary

### Implemented Features
✅ **Chat Interface**: Modern chat UI with message bubbles
✅ **AI Integration**: Google Gemini 2.0 Flash API
✅ **Image Analysis**: DICOM viewport image capture
✅ **System Prompt**: Medical imaging specialized AI responses
✅ **Responsive Design**: Professional medical application UI
✅ **Error Handling**: Robust error management and user feedback

### Technical Stack
- **Framework**: React + TypeScript
- **AI Service**: Google Gemini API
- **Platform**: OHIF Viewer v3.11
- **Styling**: Tailwind CSS + Custom CSS
- **Build Tool**: Webpack + Babel

### Architecture Overview
```
OHIF Viewer
├── Custom Extension (my-extension)
│   ├── DummyPanel (Container)
│   └── DummyComponent (Chat Interface)
├── Mode Configuration
├── API Integration (Gemini)
└── UI Components (Chat, Messages, Controls)
```

---

## 📝 Next Steps

### Potential Enhancements
1. **Advanced Features**:
   - Message history persistence
   - Multi-image analysis
   - Custom annotation integration
   - Export capabilities

2. **Performance Optimizations**:
   - Message virtualization
   - Image compression
   - Caching strategies

3. **User Experience**:
   - Typing indicators
   - Message reactions
   - Theme customization
   - Keyboard shortcuts

### Contributing
- Follow OHIF coding standards
- Add comprehensive tests
- Update documentation
- Submit pull requests

---

*This guide provides a complete walkthrough for creating an AI-powered OHIF extension. For specific implementation details, refer to the source code in the `custom-extensions/my-extension` directory.*
