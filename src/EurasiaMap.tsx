// ============================================================================
// EurasiaMap.tsx
// Core map visualization component that renders an interactive map using DeckGL
// Features:
// - Interactive geographic visualization
// - Hexagonal region overlay with continent-based coloring
// - Clickable point markers
// - Hover tooltips for both regions and points
// - Customizable view state and projection
// ============================================================================

import React, { useEffect, useMemo, useState } from "react";
import DeckGL from "@deck.gl/react";
import { Map } from "react-map-gl";
import { GeoJsonLayer, ScatterplotLayer } from "@deck.gl/layers";
import { COORDINATE_SYSTEM, MapView, MapViewState } from "@deck.gl/core";
import type { ProjectionSpecification } from "mapbox-gl";
import {
    GeoJsonData,
    PointData,
    PointHoverInfo,
    HexagonHoverInfo
} from './types';
import { Feature, Geometry } from "geojson";

// ============================================================================
// Data Imports
// Static data files for map visualization
// ============================================================================
import hexagonDataPath from './data/landgrid_wgs84_metadata.geojson';
import pointData from './data/coords_wgs84.json';

// ============================================================================
// Types and Interfaces
// Define component props and type constraints
// ============================================================================
interface EurasiaMapProps {
    selectedPoint: PointData | null;        // Currently selected point on map
    onPointClick: (point: PointData) => void; // Callback for point selection
}

// ============================================================================
// Constants
// Configuration values for map initialization
// ============================================================================
// MapBox configuration
const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
const MAPBOX_STYLE = 'mapbox://styles/mapbox/dark-v11';

// Initial map view configuration
const INITIAL_VIEW_STATE: MapViewState = {
    longitude: 75,     // Center longitude
    latitude: 30,      // Center latitude
    zoom: 2.5,         // Initial zoom level
    pitch: 45,         // 3D viewing angle
    bearing: 0,        // Map rotation
};

// Map projection settings
const MAP_PROJECTION: ProjectionSpecification = {
    name: 'mercator' as const,
    center: [0, 30]
};

// ========================================================================
// Utility Functions
// ========================================================================

/**
 * Determines the fill color for geographic regions based on continent ID
 * Returns RGBA values as array of numbers
 */
const getContinentColor = (feature: Feature<Geometry>): [number, number, number, number] => {
    const continentId = feature.properties?.continent_id;
    switch (continentId) {
        case 'EU':
            return [65, 105, 225, 40];  // Royal Blue for Europe
        case 'AS_N':
            return [220, 20, 60, 40];   // Crimson for North Asia
        case 'AS_S':
            return [255, 140, 0, 40];   // Dark Orange for South Asia
        case 'AF_N':
            return [154, 205, 50, 40];  // Yellow Green for North Africa
        case 'AF_S':
            return [138, 43, 226, 40];  // Blue Violet for South Africa
        case 'ME':
            return [64, 224, 208, 40];  // Turquoise for Middle East
        default:
            return [128, 128, 128, 40]; // Gray for other/unknown regions
    }
};

// ============================================================================
// Main Component
// ============================================================================
const EurasiaMap: React.FC<EurasiaMapProps> = ({
                                                   selectedPoint,
                                                   onPointClick,
                                               }) => {
    // ========================================================================
    // State Management
    // ========================================================================
    // Map view state for controlling camera position
    const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);
    // Hover states for tooltips
    const [pointHoverInfo, setPointHoverInfo] = useState<PointHoverInfo | null>(null);
    const [hexagonHoverInfo, setHexagonHoverInfo] = useState<HexagonHoverInfo | null>(null);
    // Geographic data state
    const [hexagonData, setHexagonData] = useState<GeoJsonData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // ========================================================================
    // Data Loading
    // ========================================================================
    useEffect(() => {
        // Async function to load hexagon geometry data
        const loadHexagonData = async () => {
            try {
                const response = await fetch(hexagonDataPath);
                const data = await response.json();
                setHexagonData(data);
            } catch (error) {
                console.error('Error loading hexagon data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadHexagonData();
    }, []); // Empty dependency array means this runs once on mount

    // ========================================================================
    // Layer Configuration
    // ========================================================================
    // Memoized layer definitions to prevent unnecessary recalculation
    const layers = useMemo(() => {
        if (!hexagonData) {
            return [];
        }

        return [
            // Base layer for hexagonal regions
            new GeoJsonLayer({
                id: 'hexagon-layer',
                data: hexagonData,
                filled: true,
                stroked: true,
                getFillColor: getContinentColor,
                getLineColor: [0, 240, 0, 75],  // Green borders
                lineWidthMinPixels: 1,
                coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
                wrapLongitude: true,
                pickable: true,  // Enable hover interactions
                onHover: ({object, x, y}) => {
                    setHexagonHoverInfo(object ? {object, x, y} : null);
                }
            }),

            // Point layer for individual locations
            new ScatterplotLayer({
                id: 'point-layer',
                data: pointData as PointData[],
                pickable: true,
                opacity: 0.9,
                stroked: true,
                filled: true,
                radiusMinPixels: 8,
                getPosition: (d: PointData) => [d.longitude, d.latitude],
                getFillColor: [255, 0, 255],  // Magenta points
                getLineColor: [0, 0, 0, 100], // Black borders
                lineWidthMinPixels: 1.5,
                onClick: ({object}) => {
                    if (object) {
                        onPointClick(object);
                    }
                },
                onHover: ({object, x, y}) => {
                    setPointHoverInfo(object ? {object, x, y} : null);
                }
            }),
        ];
    }, [hexagonData, onPointClick]);

    // Show loading state while data is being fetched
    if (isLoading) {
        return <div>Loading map data...</div>;
    }

    // ========================================================================
    // Tooltip Rendering
    // ========================================================================
    const renderTooltip = () => {
        // Common tooltip styles
        const tooltipStyle = {
            position: 'absolute' as const,
            zIndex: 1,
            pointerEvents: 'none' as const,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '8px',
            borderRadius: '4px',
            color: 'white',
            fontSize: '12px',
            transform: 'translate(-50%, -100%)',
            marginTop: '-20px'
        };

        // Render hexagon region tooltip
        if (hexagonHoverInfo) {
            return (
                <div
                    style={{
                        ...tooltipStyle,
                        left: hexagonHoverInfo.x,
                        top: hexagonHoverInfo.y,
                    }}
                >
                    <div>State ID: {hexagonHoverInfo.object.properties.state_id}</div>
                    <div>Continent: {hexagonHoverInfo.object.properties.continent_id}</div>
                </div>
            );
        }

        // Render point tooltip
        if (pointHoverInfo) {
            return (
                <div
                    style={{
                        ...tooltipStyle,
                        left: pointHoverInfo.x,
                        top: pointHoverInfo.y,
                    }}
                >
                    <div>Node ID: {pointHoverInfo.object.node_id}</div>
                </div>
            )
        }

        return null;
    };

    // ========================================================================
    // Component Render
    // ========================================================================
    return (
        <div className="relative">
            <DeckGL
                initialViewState={INITIAL_VIEW_STATE}
                viewState={viewState}
                onViewStateChange={({viewState: newViewState}) => {
                    // Safely update view state with fallbacks to current values
                    const safeViewState: MapViewState = {
                        longitude: newViewState.longitude ?? viewState.longitude,
                        latitude: newViewState.latitude ?? viewState.latitude,
                        zoom: newViewState.zoom ?? viewState.zoom,
                        pitch: newViewState.pitch ?? viewState.pitch,
                        bearing: newViewState.bearing ?? viewState.bearing
                    };
                    setViewState(safeViewState);
                }}
                controller={true}  // Enable map interaction
                layers={layers}
                views={new MapView({repeat: true})}
                getCursor={({isDragging}) =>
                    isDragging ? 'grabbing' : ((pointHoverInfo || hexagonHoverInfo) ? 'pointer' : 'grab')
                }
            >
                {/* Base map layer */}
                <Map
                    mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
                    mapStyle={MAPBOX_STYLE}
                    projection={MAP_PROJECTION}
                />
                {/* Render any active tooltips */}
                {renderTooltip()}
            </DeckGL>
        </div>
    );
};

// ============================================================================
// Export Component
// ============================================================================
export default EurasiaMap;