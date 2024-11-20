// EurasiaMap.tsx
import hexagonData from './data/landgrid_wgs84_metadata.geojson';
import pointData from './data/coords_wgs84.json';

import {COORDINATE_SYSTEM, MapView, MapViewState} from "@deck.gl/core";
import type {ProjectionSpecification} from "mapbox-gl";
import React, {useMemo, useState} from "react";
import {GeoJsonLayer, ScatterplotLayer} from "@deck.gl/layers";
import DeckGL from "@deck.gl/react";
import {Map} from "react-map-gl";
import {HoverInfo} from "./types";

const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
const MAPBOX_STYLE = 'mapbox://styles/mapbox/dark-v11';

interface EurasiaMapProps {
    selectedPoint: { node_id: string; latitude: number; longitude: number } | null;
    onPointClick: (point: any) => void;
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
const getContinentColor = (continentId: string): [number, number, number, number] => {
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

const EurasiaMap: React.FC<EurasiaMapProps> = ({ selectedPoint, onPointClick }) => {
    const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);
    const [pointHoverInfo, setPointHoverInfo] = useState<HoverInfo | null>(null);
    const [hexagonHoverInfo, setHexagonHoverInfo] = useState<HexagonHoverInfo | null>(null);

    const layers = useMemo(() => [
        new GeoJsonLayer({
            id: 'hexagon-layer',
            data: hexagonData,
            filled: true,
            stroked: true,
            getFillColor: f => getContinentColor(f.properties.continent_id),
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
            getPosition: d => [d.longitude, d.latitude],
            getFillColor: [255, 0, 255],
            getLineColor: [0, 0, 0, 100],
            lineWidthMinPixels: 1.5,
            parameters: { depthTest: false },
            onClick: ({object, x, y}) => {
                if (object) {
                    onPointClick(object);
                }
            },
            onHover: ({object, x, y}) => {
                setPointHoverInfo(object ? {object, x, y} : null);
            }
        }),
    ], [onPointClick]);

    const renderTooltip = () => {
        if (pointHoverInfo) {
            return (
                <div
                    style={{
                        position: 'absolute',
                        zIndex: 1,
                        pointerEvents: 'none',
                        left: pointHoverInfo.x,
                        top: pointHoverInfo.y,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: '8px',
                        borderRadius: '4px',
                        color: 'white',
                        fontSize: '12px',
                        transform: 'translate(-50%, -100%)',
                        marginTop: '-20px'
                    }}
                >
                    <div>Node ID: {pointHoverInfo.object.node_id}</div>
                    <div>Lat: {pointHoverInfo.object.latitude.toFixed(4)}°</div>
                    <div>Lon: {pointHoverInfo.object.longitude.toFixed(4)}°</div>
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
        <div>
            <DeckGL
                initialViewState={INITIAL_VIEW_STATE}
                viewState={viewState}
                onViewStateChange={({ viewState: newViewState }) => {
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
                views={new MapView({ repeat: true })}
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