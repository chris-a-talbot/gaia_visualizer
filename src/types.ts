import { Feature, FeatureCollection } from 'geojson';

export interface GeoJsonData extends FeatureCollection {
    type: 'FeatureCollection';
    features: Feature[];
}

export interface PointData {
    node_id: number;
    longitude: number;
    latitude: number;
}

export interface FluxDataEntry {
    source_id: string[];
    target_id: string[];
    value: number[];
}

export interface FluxDataResponse {
    time_series: FluxDataEntry[][];
    average_flux: FluxDataEntry[];
}

export interface HoverInfo {
    x: number;
    y: number;
    object: any;
}

export interface PointHoverInfo extends HoverInfo {
    object: PointData;
}

// Define centerpoint structure
export interface Centerpoint {
    longitude: number;
    latitude: number;
}

// Update hexagon properties to include centerpoint
export interface HexagonProperties {
    state_id: number;
    continent_id: string;
    centerpoint: Centerpoint;
}

export interface HexagonHoverInfo extends HoverInfo {
    object: {
        properties: HexagonProperties;
    };
}