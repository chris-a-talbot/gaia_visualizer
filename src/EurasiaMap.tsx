// Import datasets
import hexagonData from './data/landgrid_wgs84.geojson';
import pointData from './data/coords_wgs84.json';

// Import types
import {COORDINATE_SYSTEM, MapView, MapViewState} from "@deck.gl/core";
import type {ProjectionSpecification} from "mapbox-gl";
import React, {useMemo, useState} from "react";
import {GeoJsonLayer, ScatterplotLayer} from "@deck.gl/layers";
import DeckGL from "@deck.gl/react";
import {Map} from "react-map-gl";
import {HoverInfo} from "./types";

// Set up Mapbox for base map
const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
const MAPBOX_STYLE = 'mapbox://styles/mapbox/dark-v11';

// Type for the EurasiaMap component properties
interface EurasiaMapProps {
    selectedPoint: { node_id: string; latitude: number; longitude: number } | null;
    onPointClick: (point: any) => void;
}

// Define initial view state for the initial map
const INITIAL_VIEW_STATE: MapViewState = {
    longitude: 70,
    latitude: 30,
    zoom: 2,
    pitch: 45,
    bearing: 0,
};

// Define the map projection
const MAP_PROJECTION: ProjectionSpecification = {
    name: 'mercator' as const,
    center: [0, 30]
};

const EurasiaMap: React.FC<EurasiaMapProps> = ({ selectedPoint, onPointClick }) => {
    // State for map view
    const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);

    // State for hover info
    const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

    const layers = useMemo(() => [
        // Hexagon polygon layer
        new GeoJsonLayer({
            id: 'hexagon-layer',
            data: hexagonData,
            filled: true,
            stroked: true,
            getFillColor: [255, 255, 255, 10],
            getLineColor: [0, 240, 0, 75],
            lineWidthMinPixels: 1,
            coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
            wrapLongitude: true,
        }),
        // Point layer
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
                setHoverInfo(object ? {object, x, y} : null);
            }
        }),
    ], [onPointClick]);

    const renderTooltip = () => {
        if (!hoverInfo) return null;

        return (
            <div
                style={{
                    position: 'absolute',
                    zIndex: 1,
                    pointerEvents: 'none',
                    left: hoverInfo.x,
                    top: hoverInfo.y,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: '8px',
                    borderRadius: '4px',
                    color: 'white',
                    fontSize: '12px',
                    transform: 'translate(-50%, -100%)',
                    marginTop: '-20px'
                }}
            >
                <div>Node ID: {hoverInfo.object.node_id}</div>
                <div>Lat: {hoverInfo.object.latitude.toFixed(4)}°</div>
                <div>Lon: {hoverInfo.object.longitude.toFixed(4)}°</div>
            </div>
        );
    };

    return (
        // Start main div
        <div>

            {/* Start DeckGL component */}
            {/* Start DeckGL declaration */}
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
                    isDragging ? 'grabbing' : (hoverInfo ? 'pointer' : 'grab')
                }
            > {/* End DeckGL declaration */}

                {/* Start Map component */}
                <Map
                    mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
                    mapStyle={MAPBOX_STYLE}
                    projection={MAP_PROJECTION}
                />
                {/* End Map component */}

                {renderTooltip()}

            </DeckGL>
            {/* End DeckGL component */}

        </div>
        // End main div
    );
};

export default EurasiaMap;