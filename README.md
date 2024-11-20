# Human Genetic Ancestry Visualization

An interactive visualization tool for exploring the geographic history of human genetic ancestry, based on the research paper "A geographic history of human genetic ancestry" by Grundler et al. (2024).

## Overview

This application provides an interactive map interface for visualizing the movement and distribution of human genetic ancestry across Eurasia and Africa. It features:

- Interactive map visualization using DeckGL and Mapbox
- Geographic visualization of genetic data points
- Hexagonal geographic grid overlay
- Hover tooltips with detailed node information
- Resizable side panels for additional data and controls
- Support for point selection and detailed information display

## Technical Stack

- React
- DeckGL for WebGL-powered data visualization
- Mapbox GL JS for base map rendering
- TypeScript for type safety
- Tailwind CSS for styling
- shadcn/ui for UI components

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Mapbox API token
- Access to genetic data files:
    - `landgrid_wgs84.geojson` - Hexagonal grid data
    - `coords_wgs84.json` - Point coordinate data

## Environment Setup

1. Clone the repository
2. Create a `.env` file in the root directory with your Mapbox token:
```
REACT_APP_MAPBOX_TOKEN=your_mapbox_token_here
```

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
```

## Data Structure

The application expects two main data files:

### Point Data (`coords_wgs84.json`)
```typescript
interface PointData {
  node_id: string;
  latitude: number;
  longitude: number;
}
```

### Hexagon Grid Data (`landgrid_wgs84.geojson`)
GeoJSON file containing the hexagonal grid overlay for the map.

## Core Components

### EurasiaMap
The main map component handling the visualization of geographic data. Features:
- Interactive map controls (pan, zoom, rotate)
- Multiple visualization layers (hexagons and points)
- Hover interactions
- Point selection

### App
The root component managing:
- State management for selected points
- Sidebar controls and resizing
- Layout and component organization

## Features

1. **Interactive Map**
    - Pan, zoom, and rotate controls
    - Point selection
    - Hover tooltips

2. **Data Visualization**
    - Geographic point distribution
    - Hexagonal grid overlay
    - Color-coded data representation

3. **UI Controls**
    - Resizable sidebars
    - Detailed point information
    - Map statistics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

Research and code released under CC-BY 4.0 International license.

## Citation

If you use this visualization in your research, please cite:
```
Grundler, M. C., Terhorst, J., & Bradburd, G. S. (2024). A geographic history of human genetic ancestry. bioRxiv.
```

## Acknowledgments

This project is based on research conducted at the University of Michigan, Department of Ecology and Evolutionary Biology and Department of Statistics.