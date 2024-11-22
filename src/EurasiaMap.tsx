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
import {ArcLayer, GeoJsonLayer, ScatterplotLayer} from "@deck.gl/layers";
import { COORDINATE_SYSTEM, MapView, MapViewState, Layer } from "@deck.gl/core";
import type { ProjectionSpecification } from "mapbox-gl";
import {
    GeoJsonData,
    PointData,
    PointHoverInfo,
    HexagonHoverInfo, HexagonProperties
} from './types';
import { Feature, Geometry } from "geojson";

// ============================================================================
// Data Imports
// Static data files for map visualization
// ============================================================================
import hexagonDataPath from './data/landgrid_wgs84_metadata.geojson';
import pointData from './data/coords_wgs84.json';
import fluxData from './data/flux.json';

// ============================================================================
// Types and Interfaces
// Define component props and type constraints
// ============================================================================
interface EurasiaMapProps {
    selectedPoint: PointData | null;
    onPointClick: (point: PointData) => void;
    showArcs: boolean;
}

interface ArcData {
    source: [number, number];
    target: [number, number];
    weight: number;
}

// Type guard to check if a feature has valid properties
const hasValidProperties = (feature: Feature<Geometry>): feature is Feature<Geometry> & {
    properties: HexagonProperties
} => {
    return feature.properties !== null &&
        'centerpoint' in feature.properties &&
        feature.properties.centerpoint !== null &&
        'longitude' in feature.properties.centerpoint &&
        'latitude' in feature.properties.centerpoint;
};

const generateRandomArcs = (hexagonData: GeoJsonData, count: number = 50): ArcData[] => {
    const features = hexagonData.features;
    const arcs: ArcData[] = [];

    // Filter features to only include those with valid properties
    const validFeatures = features.filter(hasValidProperties);

    if (validFeatures.length < 2) {
        console.error('Not enough valid features to generate arcs');
        return [];
    }

    for (let i = 0; i < count; i++) {
        const sourceFeature = validFeatures[Math.floor(Math.random() * validFeatures.length)];
        const targetFeature = validFeatures[Math.floor(Math.random() * validFeatures.length)];

        // No need for null checks here since we filtered the features
        const sourcePoint = sourceFeature.properties.centerpoint;
        const targetPoint = targetFeature.properties.centerpoint;

        arcs.push({
            source: [sourcePoint.longitude, sourcePoint.latitude],
            target: [targetPoint.longitude, targetPoint.latitude],
            weight: Math.random() * 10
        });
    }

    return arcs;
};

const getArcColor = (weight: number): [number, number, number] => {
    const r = Math.min(255, 255 * (0.5 + weight / 10));
    const g = Math.max(0, 255 * (1 - weight / 10));
    return [r, g, 0];
};

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
                                                   showArcs,
                                               }) => {
    const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);
    const [pointHoverInfo, setPointHoverInfo] = useState<PointHoverInfo | null>(null);
    const [hexagonHoverInfo, setHexagonHoverInfo] = useState<HexagonHoverInfo | null>(null);
    const [hexagonData, setHexagonData] = useState<GeoJsonData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [arcData, setArcData] = useState<ArcData[]>([]);

    useEffect(() => {
        const loadHexagonData = async () => {
            try {
                const response = await fetch(hexagonDataPath);
                const data = await response.json();
                setHexagonData(data);
                setArcData(generateRandomArcs(data));
            } catch (error) {
                console.error('Error loading hexagon data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadHexagonData();
    }, []);

    const layers = useMemo(() => {
        if (!hexagonData) {
            return [];
        }

        const layers: Layer[] = [
            new GeoJsonLayer({
                id: 'hexagon-layer',
                data: hexagonData,
                filled: true,
                stroked: true,
                getFillColor: getContinentColor,
                getLineColor: [0, 240, 0, 75],
                lineWidthMinPixels: 1,
                coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
                wrapLongitude: true,
                pickable: true,
                onHover: ({object, x, y}) => {
                    setHexagonHoverInfo(object ? {object, x, y} : null);
                }
            }) as Layer,

            new ScatterplotLayer({
                id: 'point-layer',
                data: pointData as PointData[],
                pickable: true,
                opacity: 0.9,
                stroked: true,
                filled: true,
                radiusMinPixels: 8,
                getPosition: (d: PointData) => [d.longitude, d.latitude],
                getFillColor: [255, 0, 255],
                getLineColor: [0, 0, 0, 100],
                lineWidthMinPixels: 1.5,
                onClick: ({object}) => {
                    if (object) {
                        onPointClick(object);
                    }
                },
                onHover: ({object, x, y}) => {
                    setPointHoverInfo(object ? {object, x, y} : null);
                }
            }) as Layer
        ];

        if (showArcs) {
            layers.push(
                new ArcLayer({
                    id: 'arc-layer',
                    data: arcData,
                    pickable: true,
                    getSourcePosition: d => d.source,
                    getTargetPosition: d => d.target,
                    getSourceColor: d => getArcColor(d.weight),
                    getTargetColor: d => getArcColor(d.weight),
                    getWidth: d => 1 + d.weight * 2,
                    greatCircle: true
                }) as Layer
            );
        }

        return layers;
    }, [hexagonData, onPointClick, showArcs, arcData]);

    const renderTooltip = () => {
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

        if (hexagonHoverInfo) {
            const { state_id, continent_id, centerpoint } = hexagonHoverInfo.object.properties;
            return (
                <div
                    style={{
                        ...tooltipStyle,
                        left: hexagonHoverInfo.x,
                        top: hexagonHoverInfo.y,
                    }}
                >
                    <div>State ID: {state_id}</div>
                    <div>Continent: {continent_id}</div>
                    <div>Center: ({centerpoint.longitude.toFixed(4)}, {centerpoint.latitude.toFixed(4)})</div>
                </div>
            );
        }

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
            );
        }

        return null;
    };

    if (isLoading) {
        return <div>Loading map data...</div>;
    }

    return (
        <div className="relative">
            <DeckGL
                initialViewState={INITIAL_VIEW_STATE}
                viewState={viewState}
                onViewStateChange={({viewState: newViewState}) => {
                    const safeViewState: MapViewState = {
                        longitude: newViewState.longitude ?? viewState.longitude,
                        latitude: newViewState.latitude ?? viewState.latitude,
                        zoom: newViewState.zoom ?? viewState.zoom,
                        pitch: newViewState.pitch ?? viewState.pitch,
                        bearing: newViewState.bearing ?? viewState.bearing
                    };
                    setViewState(safeViewState);
                }}
                controller={true}
                layers={layers}
                views={new MapView({repeat: true})}
                getCursor={({isDragging}) =>
                    isDragging ? 'grabbing' : ((pointHoverInfo || hexagonHoverInfo) ? 'pointer' : 'grab')
                }
            >
                <Map
                    mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
                    mapStyle={MAPBOX_STYLE}
                    projection={MAP_PROJECTION}
                />
                {renderTooltip()}
            </DeckGL>
        </div>
    );
};

export default EurasiaMap;