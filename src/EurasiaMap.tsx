// EurasiaMap.tsx
import hexagonData from './data/landgrid_wgs84_metadata.geojson';
import pointData from './data/coords_wgs84.json';

import {ArcLayer} from '@deck.gl/layers';
import {COORDINATE_SYSTEM, MapView, MapViewState, Layer} from "@deck.gl/core";
import type {ProjectionSpecification} from "mapbox-gl";
import React, {useMemo, useState, useEffect} from "react";
import {GeoJsonLayer, ScatterplotLayer} from "@deck.gl/layers";
import DeckGL from "@deck.gl/react";
import {Map} from "react-map-gl";
import * as turf from '@turf/turf';
import { Feature, Geometry } from 'geojson';
import {HoverInfo} from "./types";

const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
const MAPBOX_STYLE = 'mapbox://styles/mapbox/dark-v11';

interface HexagonProperties {
    state_id: string;
    continent_id: string;
}

// Add interfaces for migration data
interface MigrationFlow {
    source_id: string;
    target_id: string;
    value: number;
}

interface FlowWithCoordinates extends MigrationFlow {
    source_coordinates: [number, number];
    target_coordinates: [number, number];
}

interface EurasiaMapProps {
    selectedPoint: { node_id: string; latitude: number; longitude: number } | null;
    onPointClick: (point: any) => void;
    averageMigrationFlows?: MigrationFlow[];
}

// Add new interface for hexagon hover info
interface HexagonHoverInfo {
    x: number;
    y: number;
    object: {
        properties: {
            state_id: number;
            continent_id: string;
        };
    };
}

const INITIAL_VIEW_STATE: MapViewState = {
    longitude: 70,
    latitude: 30,
    zoom: 2,
    pitch: 45,
    bearing: 0,
};

const MAP_PROJECTION: ProjectionSpecification = {
    name: 'mercator' as const,
    center: [0, 30]
};

// Color mapping function for continents
const getContinentColor = (feature: Feature<Geometry>): [number, number, number, number] => {
    const continentId = feature.properties?.continent_id;
    switch (continentId) {
        case 'EU':
            return [65, 105, 225, 40];  // Royal Blue
        case 'AS_N':
            return [220, 20, 60, 40];   // Crimson
        case 'AS_S':
            return [255, 140, 0, 40];   // Dark Orange
        case 'AF_N':
            return [154, 205, 50, 40];  // Yellow Green
        case 'AF_S':
            return [138, 43, 226, 40];  // Blue Violet
        case 'ME':
            return [64, 224, 208, 40];  // Turquoise
        default:
            return [128, 128, 128, 40]; // Gray (fallback)
    }
};

const EurasiaMap: React.FC<EurasiaMapProps> = ({
                                                   selectedPoint,
                                                   onPointClick,
                                                   averageMigrationFlows = []
                                               }) => {
    const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);
    const [pointHoverInfo, setPointHoverInfo] = useState<HoverInfo | null>(null);
    const [hexagonHoverInfo, setHexagonHoverInfo] = useState<HexagonHoverInfo | null>(null);
    const [flowHoverInfo, setFlowHoverInfo] = useState<FlowWithCoordinates | null>(null);
    const [showMigration, setShowMigration] = useState(false);

    // Modified centroidLookup creation with debug logging
    const centroidLookup = useMemo(() => {
        const lookup: { [key: string]: [number, number] } = {};
        if (hexagonData && hexagonData.features) {
            console.log('Processing hexagon features:', hexagonData.features.length);
            hexagonData.features.forEach((feature: Feature<Geometry>) => {
                if (feature.geometry && feature.properties?.state_id) {
                    const centroid = turf.centroid(feature);
                    lookup[feature.properties.state_id] = [
                        centroid.geometry.coordinates[0],
                        centroid.geometry.coordinates[1]
                    ];
                }
            });
        }
        return lookup;
    }, [hexagonData]);

    useEffect(() => {
        console.log('Migration Flows:', averageMigrationFlows);
        console.log('Centroid Lookup:', centroidLookup);
    }, [averageMigrationFlows, centroidLookup]);

    // Modified flows calculation with debug logging
    const flowsWithCoordinates = useMemo(() => {
        console.log('Processing flows:', averageMigrationFlows.length);

        const flows = averageMigrationFlows.map(flow => {
            const sourceCoords = centroidLookup[flow.source_id];
            const targetCoords = centroidLookup[flow.target_id];

            if (!sourceCoords) {
                console.warn(`Missing source coordinates for ID: ${flow.source_id}`);
            }
            if (!targetCoords) {
                console.warn(`Missing target coordinates for ID: ${flow.target_id}`);
            }

            return {
                ...flow,
                source_coordinates: sourceCoords,
                target_coordinates: targetCoords
            };
        }).filter((flow): flow is FlowWithCoordinates => {
            const valid = !!flow.source_coordinates && !!flow.target_coordinates;
            if (!valid) {
                console.warn('Filtered out flow:', flow);
            }
            return valid;
        });

        console.log('Valid flows after processing:', flows.length);
        return flows;
    }, [averageMigrationFlows, centroidLookup]);

    const layers = useMemo(() => {
        const baseLayers: Layer[] = [
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
            }),
            new ScatterplotLayer({
                id: 'point-layer',
                data: pointData,
                pickable: true,
                opacity: 0.9,
                stroked: true,
                filled: true,
                radiusMinPixels: 8,
                getPosition: (d: { longitude: any; latitude: any; }) => [d.longitude, d.latitude],
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
            })
        ];

        // Only add migration layer if toggle is on
        if (showMigration) {
            console.log('Attempting to show migration with flows:', flowsWithCoordinates.length);

            if (flowsWithCoordinates.length === 0) {
                console.warn('No valid flows to display');
            } else {
                baseLayers.push(
                    new ArcLayer<FlowWithCoordinates>({
                        id: 'migration-flow-layer',
                        data: flowsWithCoordinates,
                        pickable: true,
                        getSourcePosition: d => d.source_coordinates,
                        getTargetPosition: d => d.target_coordinates,
                        getSourceColor: [255, 0, 128],
                        getTargetColor: [0, 128, 255],
                        getWidth: d => Math.sqrt(d.value) * 2,
                        getHeight: 0.5,
                        greatCircle: true,
                        wrapLongitude: true,
                        opacity: 0.8,
                        onHover: ({object}) => {
                            setFlowHoverInfo(object || null);
                        }
                    })
                );
            }
        }

        return baseLayers;
    }, [onPointClick, showMigration, flowsWithCoordinates]);


    const renderTooltip = () => {
        if (flowHoverInfo) {
            return (
                <div
                    style={{
                        position: 'absolute',
                        zIndex: 1,
                        pointerEvents: 'none',
                        left: pointHoverInfo?.x || 0,
                        top: pointHoverInfo?.y || 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: '8px',
                        borderRadius: '4px',
                        color: 'white',
                        fontSize: '12px',
                        transform: 'translate(-50%, -100%)',
                        marginTop: '-20px'
                    }}
                >
                    <div>From State: {flowHoverInfo.source_id}</div>
                    <div>To State: {flowHoverInfo.target_id}</div>
                    <div>Average Migration: {flowHoverInfo.value.toFixed(2)}</div>
                </div>
            );
        }

        if (hexagonHoverInfo) {
            return (
                <div
                    style={{
                        position: 'absolute',
                        zIndex: 1,
                        pointerEvents: 'none',
                        left: hexagonHoverInfo.x,
                        top: hexagonHoverInfo.y,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: '8px',
                        borderRadius: '4px',
                        color: 'white',
                        fontSize: '12px',
                        transform: 'translate(-50%, -100%)',
                        marginTop: '-20px'
                    }}
                >
                    <div>State ID: {hexagonHoverInfo.object.properties.state_id}</div>
                    <div>Continent: {hexagonHoverInfo.object.properties.continent_id}</div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowMigration(!showMigration)}
                style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    zIndex: 10,
                    padding: '0.5rem 1rem',
                    backgroundColor: showMigration ? '#2563eb' : '#4b5563',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    transition: 'background-color 0.2s',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = showMigration ? '#1d4ed8' : '#374151';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = showMigration ? '#2563eb' : '#4b5563';
                }}
            >
                {showMigration ? 'Hide Migration' : 'Show Migration'}
            </button>
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
                    isDragging ? 'grabbing' : ((pointHoverInfo || hexagonHoverInfo || flowHoverInfo) ? 'pointer' : 'grab')
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