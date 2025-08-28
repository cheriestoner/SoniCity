#!/bin/bash

# Get parent folder name
parent=$(basename "$PWD")

# Counter
i=1

# Loop through all .m4a files
for f in *.m4a; do
  # Get filename without extension
  base="${f%.m4a}"
  # Skip if no .m4a files exist
  [ -e "$f" ] || continue

  # New filename: parent-i
  new="${parent}-${i}"

  # Create txt file and save filename into it
  echo "${base}" > "${new}.txt"
  
  ffmpeg -i "${base}.m4a" "${new}.wav"
  echo "Converted ${base}.m4a → ${new}.wav"

  magick "${base}.HEIC" "${new}.jpg"
  echo "Converted ${base}.HEIC → ${new}.jpg"


  # # Rename file
  # mv "$f" "$new"
  # echo "Renamed $f → $new"
  i=$((i+1))
done