#!/usr/bin/env python3
"""
Script to automatically update the 'describ' column in imagedata-shz.csv 
with tags extracted from corresponding JSON metadata files.

This script will:
1. Read all JSON metadata files from the new user-based structure
2. Extract the 'tags' array from each JSON file
3. Convert tags to semicolon-separated string format
4. Update the CSV file by matching filenames
5. Create a backup of the original CSV
"""

import os
import json
import csv
import shutil
from pathlib import Path

def extract_tags_from_json(json_file_path):
    """
    Extract tags from a JSON metadata file.
    Returns the tags as a semicolon-separated string, or None if error.
    """
    try:
        with open(json_file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)
            
        if 'tags' in data and isinstance(data['tags'], list):
            # Convert tags array to semicolon-separated string
            tags_string = '; '.join(data['tags'])
            return tags_string
        else:
            print(f"Warning: No 'tags' array found in {json_file_path}")
            return None
            
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON file {json_file_path}: {e}")
        return None
    except Exception as e:
        print(f"Error reading file {json_file_path}: {e}")
        return None

def find_json_files(archive_path):
    """
    Find all JSON metadata files in the new user-based structure.
    Returns a dictionary mapping base filenames to their tags.
    """
    json_data = {}
    
    users_path = os.path.join(archive_path, 'users')
    if not os.path.exists(users_path):
        print(f"Error: Users folder not found at {users_path}")
        return json_data
    
    # Walk through all user folders
    for user_folder in os.listdir(users_path):
        user_path = os.path.join(users_path, user_folder)
        if not os.path.isdir(user_path) or not user_folder.startswith('user'):
            continue
            
        # Check each location (greenpark, sciencepark)
        for location in ['greenpark', 'sciencepark']:
            location_path = os.path.join(user_path, location)
            if not os.path.exists(location_path):
                continue
                
            # Look for JSON files
            for filename in os.listdir(location_path):
                if filename.endswith('.json') and not filename.startswith('.'):
                    json_path = os.path.join(location_path, filename)
                    
                    # Extract tags from JSON
                    tags = extract_tags_from_json(json_path)
                    if tags:
                        # Create a key that matches the CSV format
                        # Remove .json extension and create base filename
                        base_filename = filename.replace('.json', '')
                        json_data[base_filename] = {
                            'tags': tags,
                            'json_path': json_path,
                            'user': user_folder,
                            'location': location
                        }
                        print(f"Found JSON: {base_filename} -> {tags}")
    
    return json_data

def update_csv_with_tags(csv_path, json_data):
    """
    Update the CSV file by replacing the 'describ' column with tags from JSON files.
    Creates a backup of the original CSV first.
    """
    # Create backup of original CSV
    backup_path = csv_path.replace('.csv', '_backup_before_json_update.csv')
    shutil.copy2(csv_path, backup_path)
    print(f"Created backup: {backup_path}")
    
    # Read the original CSV
    rows = []
    updated_count = 0
    not_found_count = 0
    
    with open(csv_path, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        fieldnames = reader.fieldnames
        
        for row in reader:
            # Try to find matching JSON data
            # The CSV has filenames like "user1_1.jpg", "user1_1.webm"
            # We need to match the base name (e.g., "user1_1")
            
            # Extract base filename from various columns
            base_filename = None
            
            # Try to extract from src column (image files)
            if 'src' in row and row['src']:
                src_filename = os.path.basename(row['src'])
                if src_filename.endswith('.jpg'):
                    base_filename = src_filename.replace('.jpg', '')
            
            # If not found, try audio column
            if not base_filename and 'audio' in row and row['audio']:
                audio_filename = os.path.basename(row['audio'])
                if audio_filename.endswith(('.webm', '.mp4')):
                    base_filename = audio_filename.replace('.webm', '').replace('.mp4', '')
            
            # Update the describ column if we found matching JSON data
            if base_filename and base_filename in json_data:
                old_describ = row.get('describ', '')
                new_describ = json_data[base_filename]['tags']
                
                if old_describ != new_describ:
                    row['describ'] = new_describ
                    updated_count += 1
                    print(f"Updated {base_filename}: '{old_describ}' -> '{new_describ}'")
                else:
                    print(f"No change needed for {base_filename}")
            else:
                if base_filename:
                    print(f"Warning: No JSON metadata found for {base_filename}")
                    not_found_count += 1
                else:
                    print(f"Warning: Could not extract base filename from row")
            
            rows.append(row)
    
    # Write updated CSV
    with open(csv_path, 'w', encoding='utf-8', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"\nCSV update completed!")
    print(f"Total rows processed: {len(rows)}")
    print(f"Rows updated: {updated_count}")
    print(f"Rows not found: {not_found_count}")
    
    return updated_count, not_found_count

def main():
    """Main function to update CSV with JSON tags."""
    current_dir = os.getcwd()
    archive_path = os.path.join(current_dir, 'archive')
    csv_path = os.path.join(current_dir, 'imagedata-shz.csv')
    
    # Check if required files/folders exist
    if not os.path.exists(archive_path):
        print(f"Error: Archive folder not found at {archive_path}")
        return
    
    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        return
    
    print("Starting CSV update from JSON metadata files...")
    print(f"Archive path: {archive_path}")
    print(f"CSV path: {csv_path}")
    
    # Step 1: Find and parse all JSON files
    print("\n1. Scanning JSON metadata files...")
    json_data = find_json_files(archive_path)
    
    if not json_data:
        print("No JSON metadata files found. Exiting.")
        return
    
    print(f"Found {len(json_data)} JSON metadata files")
    
    # Step 2: Update CSV with extracted tags
    print("\n2. Updating CSV file...")
    updated_count, not_found_count = update_csv_with_tags(csv_path, json_data)
    
    # Summary
    print("\n" + "="*60)
    print("CSV UPDATE SUMMARY")
    print("="*60)
    print(f"JSON files processed: {len(json_data)}")
    print(f"CSV rows updated: {updated_count}")
    print(f"CSV rows not found: {not_found_count}")
    print(f"Backup created: {csv_path.replace('.csv', '_backup_before_json_update.csv')}")
    print("\nCSV update completed successfully!")

if __name__ == "__main__":
    main()
