declare module "*.csv" {
    const content: Array<{
        node_id: number;
        longitude: number;
        latitude: number;
    }>;
    export default content;
}