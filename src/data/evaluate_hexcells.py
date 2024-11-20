import geopandas as gpd
import matplotlib.pyplot as plt
from shapely.geometry import shape
import numpy as np


def plot_landgrid_continents():
    # Read the GeoJSON file
    gdf = gpd.read_file('landgrid_wgs84_metadata.geojson')

    # Create figure and axis
    fig, ax = plt.subplots(figsize=(20, 10))

    # Plot base polygons with light gray fill and black edges
    gdf.plot(ax=ax, facecolor='lightgray', edgecolor='black', alpha=0.3)

    # Add continent codes as text labels at centroids
    for idx, row in gdf.iterrows():
        # Get centroid coordinates
        centroid = row.geometry.centroid
        # Get continent code - accessing it directly from the properties column
        cont_code = row.continent_id if hasattr(row, 'continent_id') else row['continent_id']
        # Add text
        ax.text(centroid.x, centroid.y, cont_code,
                horizontalalignment='center',
                verticalalignment='center',
                fontsize=8)

    # Set equal aspect ratio to prevent distortion
    ax.set_aspect('equal')

    # Set title
    plt.title('Landgrid Continent Codes')

    # Use a basic geographic extent
    plt.xlim(-180, 180)
    plt.ylim(-90, 90)

    # Add gridlines
    ax.grid(True, linestyle='--', alpha=0.5)

    # Save the plot
    plt.savefig('landgrid_continents.png', dpi=300, bbox_inches='tight')
    plt.close()


def print_geojson_structure():
    """
    Helper function to print the structure of the GeoJSON file
    """
    import json

    print("Analyzing GeoJSON structure...")
    with open('landgrid_wgs84_metadata.geojson', 'r') as f:
        data = json.load(f)

    # Print structure of first feature
    print("\nFirst feature structure:")
    first_feature = data['features'][0]
    print(json.dumps(first_feature, indent=2))

    print("\nAvailable properties:")
    if 'properties' in first_feature:
        for key in first_feature['properties'].keys():
            print(f"- {key}")


if __name__ == "__main__":
    try:
        # First print the structure to understand what we're working with
        print_geojson_structure()

        print("\nCreating visualization...")
        plot_landgrid_continents()
        print("Visualization saved as 'landgrid_continents.png'")
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        import traceback

        print("\nFull error traceback:")
        print(traceback.format_exc())