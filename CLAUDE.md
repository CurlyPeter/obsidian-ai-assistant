# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Obsidian plugin called "GAME3 AI Assistant" that provides AI-powered text, image, and speech-to-text functionality directly within Obsidian notes. The plugin supports multiple AI models including OpenAI GPT models, Anthropic Claude models, DALL-E for image generation, and Whisper for speech transcription.

### AME3 Ecosystem Integration
This plugin is part of the AME3 (formerly GAME3) enterprise framework ecosystem:

**Sister Projects:**
1. **AME3 Obsidian Vault** (`/Users/peterbeck/Obsidian/AME3/`)
   - Main content repository with enterprise framework documentation
   - Source for ame3.info website content
   - Context source for AI-powered content generation

2. **AME3Helper Plugin** (`.obsidian/plugins/ame3helper/`)
   - Companion plugin for content management and Hugo publishing
   - Transforms vault content for Hugo-based website generation
   - Handles permalink generation and asset management

3. **ame3-docbox-hugo** (`/Users/peterbeck/ame3-docbox-hugo/`)
   - Hugo-based documentation site using Docbox theme
   - Target for AME3Helper plugin publishing workflow
   - Future replacement for Obsidian Publish

## Development Commands

### Build and Development
- `npm run dev` - Start development build with watch mode (uses esbuild)
- `npm run build` - Production build with TypeScript compilation and bundling
- `npm run version` - Update version numbers in manifest.json and versions.json

### TypeScript Compilation
The project uses TypeScript with strict settings. Run `tsc -noEmit -skipLibCheck` for type checking without output.

## Project Architecture

### Core Plugin Structure
- **main.ts** - Main plugin class extending Obsidian's Plugin class
  - Handles plugin initialization, command registration, and settings management
  - Contains `processPrompts()` function for dynamic prompt processing with placeholders
  - Manages API client instantiation based on selected model (OpenAI vs Anthropic)

### AI Integration Layer
- **openai_api.ts** - AI service classes
  - `OpenAIAssistant` - Handles OpenAI API calls for text, image, and speech
  - `AnthropicAssistant` - Extends OpenAIAssistant for Anthropic Claude models
  - Both classes support streaming responses and error handling

### User Interface Components
- **modal.ts** - Modal dialog implementations
  - `ChatModal` - Interactive chat interface with image upload support
  - `PromptModal` - Text/image generation prompt interface
  - `CommandModal` - Command input modal with pre-filled defaults
  - `ChoiceModal` - Selection modal for AI assistant configuration
  - `ImageModal` - Image selection and download interface
  - `SpeechModal` - Audio recording interface for speech-to-text

### Key Features

#### Dynamic Prompt System
The plugin includes a sophisticated prompt processing system in `processPrompts()` that supports:
- `{NODE TEXT}` - Inserts complete current note content
- `{Node Name}` - Inserts current note filename
- `{LoadContent}` - Fetches and processes web content from URLs in the note
- `{DefaultUserCommand: "command"}` - Sets default command for prompt mode
- `{Temperature: 0.7}` - Overrides AI model temperature setting

#### AI Assistant Management
- Supports switching between different AI assistants stored in configurable folder
- Each assistant has its own system prompt file
- Settings allow configuration of default assistant and folder location

#### Multi-Modal Support
- Text generation with context from current note
- Image generation with DALL-E models
- Speech-to-text transcription with Whisper
- Image uploads for vision-enabled model interactions

### Build System
- **esbuild.config.mjs** - ESBuild configuration for bundling
- Development mode includes watch mode and inline source maps
- Production mode strips source maps and optimizes bundle
- External dependencies include Obsidian API and CodeMirror modules

### Settings Architecture
Plugin settings (`AiAssistantSettings` interface) include:
- API keys for OpenAI and Anthropic
- Model selection (text and image models)
- System prompt configuration
- Temperature and token limits
- Folder paths for assistants and generated images

## Development Notes

### Model Support
- OpenAI: GPT-4.1, GPT-4o, GPT-3.5-turbo, DALL-E-2/3, Whisper
- Anthropic: Claude 3 Opus, Sonnet, Haiku
- Automatic model switching for vision tasks (GPT-4-vision-preview)

### File Organization
- Source files in `src/` directory
- Built output: `main.js` (bundled plugin file)
- Plugin metadata: `manifest.json`
- Styling: `styles.css`

### Testing and Installation
For local development:
1. `npm install` - Install dependencies
2. `npm run build` - Build plugin
3. Copy built files to Obsidian plugins directory
4. Enable plugin in Obsidian settings

The plugin requires valid API keys for OpenAI and/or Anthropic services to function.