// types.ts
export interface PointData {
    node_id: string;
    latitude: number;
    longitude: number;
}

export interface HoverInfo {
    x: number;
    y: number;
    object: PointData;
}