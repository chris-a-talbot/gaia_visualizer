import json
import geopandas as gpd
import numpy as np
from shapely.geometry import shape, Point, MultiPolygon, box
import requests
import zipfile
import io
import os


def download_natural_earth_data():
    """
    Download Natural Earth data from GeoPandas' GitHub repository
    """
    url = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"

    if not os.path.exists('data'):
        os.makedirs('data')

    geojson_path = 'ne_110m_admin_0_countries.geojson'

    if not os.path.exists(geojson_path):
        print("Downloading Natural Earth data...")
        response = requests.get(url)
        if response.status_code == 200:
            with open(geojson_path, 'w', encoding='utf-8') as f:
                f.write(response.text)
            print("Download complete.")
        else:
            raise Exception(f"Failed to download data: HTTP {response.status_code}")

    return geojson_path


def load_continent_data(geojson_path):
    """
    Load and prepare continent boundaries with custom regions
    """
    # Load natural earth countries
    world = gpd.read_file(geojson_path)

    # Define Middle East countries
    middle_east_countries = [
        'Egypt', 'Iran', 'Turkey', 'Iraq', 'Saudi Arabia', 'Yemen',
        'Syria', 'Jordan', 'Israel', 'Lebanon', 'Kuwait', 'Oman',
        'Qatar', 'Bahrain', 'United Arab Emirates'
    ]

    # Create a new column for custom continent classification
    world['CUSTOM_CONTINENT'] = world['CONTINENT']

    # Move Russia to North Asia
    world.loc[world['ADMIN'] == 'Russia', 'CUSTOM_CONTINENT'] = 'North Asia'

    # Create Middle East region
    world.loc[world['ADMIN'].isin(middle_east_countries), 'CUSTOM_CONTINENT'] = 'Middle East'

    # Create split continents
    # Use latitude boundaries for rough splits
    sahara_lat = 20  # Approximate latitude of Sahara Desert
    himalaya_lat = 30  # Approximate latitude of Himalayas

    # Create base geometries for each continent
    africa = world[world['CUSTOM_CONTINENT'] == 'Africa'].dissolve().geometry.iloc[0]
    asia = world[world['CUSTOM_CONTINENT'].isin(['Asia', 'North Asia'])].dissolve().geometry.iloc[0]

    # Create splitting boxes
    world_bounds = world.total_bounds
    north_box = box(world_bounds[0], sahara_lat, world_bounds[2], world_bounds[3])
    south_box = box(world_bounds[0], world_bounds[1], world_bounds[2], sahara_lat)

    asia_north_box = box(world_bounds[0], himalaya_lat, world_bounds[2], world_bounds[3])
    asia_south_box = box(world_bounds[0], world_bounds[1], world_bounds[2], himalaya_lat)

    # Split Africa and Asia
    africa_north = africa.intersection(north_box)
    africa_south = africa.intersection(south_box)
    asia_north = asia.intersection(asia_north_box)
    asia_south = asia.intersection(asia_south_box)

    # Map regions to continents
    continent_geometries = {
        'EU': world[world['CUSTOM_CONTINENT'] == 'Europe'].dissolve().geometry.iloc[0],
        'AS_N': asia_north,
        'AS_S': asia_south,
        'AF_N': africa_north,
        'AF_S': africa_south,
        'AU': world[world['CUSTOM_CONTINENT'] == 'Oceania'].dissolve().geometry.iloc[0],
        'NA': world[world['CUSTOM_CONTINENT'] == 'North America'].dissolve().geometry.iloc[0],
        'SA': world[world['CUSTOM_CONTINENT'] == 'South America'].dissolve().geometry.iloc[0],
        'ME': world[world['CUSTOM_CONTINENT'] == 'Middle East'].dissolve().geometry.iloc[0]
    }

    # Get Russia's geometry
    russia_geometry = world[world['ADMIN'] == 'Russia'].geometry.iloc[0]

    # Create non-Russian geometries for each continent
    non_russian_geometries = {}
    for cont_name, code in {
        'Europe': 'EU',
        'Asia': 'AS_N',  # Default to North Asia for non-Russian Asia
        'Middle East': 'ME'
    }.items():
        countries = world[
            (world['CUSTOM_CONTINENT'] == cont_name) &
            (world['ADMIN'] != 'Russia')
            ]
        if not countries.empty:
            non_russian_geometries[code] = countries.dissolve().geometry.iloc[0]

    return continent_geometries, russia_geometry, non_russian_geometries


def get_nearest_continent(point, continent_geometries):
    """
    Find the nearest continent to a point
    """
    min_distance = float('inf')
    nearest_continent = None

    for cont, geom in continent_geometries.items():
        distance = point.distance(geom)
        if distance < min_distance:
            min_distance = distance
            nearest_continent = cont

    return nearest_continent


def get_nearest_non_russian_continent(point, non_russian_geometries):
    """
    Find the nearest non-Russian continental region
    """
    min_distance = float('inf')
    nearest_continent = 'AS_N'  # Default to North Asia if no close regions found

    for cont, geom in non_russian_geometries.items():
        distance = point.distance(geom)
        if distance < min_distance:
            min_distance = distance
            nearest_continent = cont

    return nearest_continent


def process_features(geojson_data, continent_geometries, russia_geometry, non_russian_geometries):
    """
    Process each feature in the GeoJSON, adding state_id and continent_id
    """
    features = geojson_data['features']

    for idx, feature in enumerate(features, 1):
        geom = shape(feature['geometry'])
        centroid = geom.centroid

        if 'properties' not in feature:
            feature['properties'] = {}

        # Check if the cell intersects with Russia
        if geom.intersects(russia_geometry):
            # If it's a border cell (intersects with Russia and extends beyond it)
            if not russia_geometry.contains(geom):
                # Use the nearest non-Russian continental region
                continent_id = get_nearest_non_russian_continent(centroid, non_russian_geometries)
            else:
                # For cells fully within Russia, classify as AS_N
                continent_id = 'AS_N'
        else:
            # For non-Russian cells, use standard classification
            continent_id = get_nearest_continent(centroid, continent_geometries)

        feature['properties']['state_id'] = idx
        feature['properties']['continent_id'] = continent_id

    return geojson_data


def main():
    """
    Main function to process the input file and create the output file
    """
    try:
        print("Starting processing...")

        # Download and load Natural Earth data
        geojson_path = download_natural_earth_data()
        continent_geometries, russia_geometry, non_russian_geometries = load_continent_data(geojson_path)

        # Read input file
        print("Reading input file...")
        with open('landgrid_wgs84.geojson', 'r') as f:
            input_data = json.load(f)

        # Process the data
        print("Processing features...")
        processed_data = process_features(input_data, continent_geometries, russia_geometry, non_russian_geometries)

        # Write to new file
        print("Writing output file...")
        with open('landgrid_wgs84_metadata.geojson', 'w') as f:
            json.dump(processed_data, f, indent=2)

        print("Processing complete. Output written to landgrid_wgs84_metadata.geojson")

    except requests.exceptions.RequestException as e:
        print(f"Error downloading Natural Earth data: {str(e)}")
    except FileNotFoundError:
        print("Error: Could not find input file 'landgrid_wgs84.geojson'")
    except Exception as e:
        print(f"An error occurred: {str(e)}")


if __name__ == "__main__":
    main()