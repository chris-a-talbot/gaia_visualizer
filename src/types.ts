// types.ts
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

export interface HexagonHoverInfo extends HoverInfo {
    object: {
        properties: {
            state_id: number;
            continent_id: string;
        };
    };
}