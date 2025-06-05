import pandas as pd
import matplotlib.pyplot as plt
import ast

# Define the taxonomy of tags
taxonomy = {
    'Source Type': ['Music', 'Traffic', 'Birds', 'Voice'],
    'Temporal': ['Loud', 'Medium loud', 'Soft', 'Getting louder', 'Varying over time', 'Getting softer', 'Continuous'],
    'Quality': ['Clear', 'Noisy', 'Chaotic', 'Harmonious', 'Controlled', 'Dynamic', 'Static', 'Moving', 'Melodic', 'Rhythmic'],
    'Context': ['Isolated', 'Standing out', 'Blended', 'Disappearing', 'Masked'],
    'Pleasantness': ['Beautiful', 'Nice', 'Uninteresting', 'Boring', 'Annoying', 'No emotion']
}

# Load the data
df = pd.read_csv('/reason_tags.csv')

# Filter out rows where 'tag' is '-'
df = df[df['tag']!= '-']

# Convert the string representation of lists in the 'tag' column to actual lists
df['tag'] = df['tag'].apply(lambda x: ast.literal_eval(x) if isinstance(x, str) else x)

# Explode the lists in the 'tag' column
exploded_df = df.explode('tag')

# Create a dictionary to store the frequency counts for each category and location
category_location_counts = {}

# Iterate over each category in the taxonomy
for category, tags in taxonomy.items():
    category_df = exploded_df[exploded_df['tag'].isin([tag.lower() for tag in tags])]
    location_counts = {}
    all_tags = set()
    for location in ['greenpark','sciencepark']:
        location_df = category_df[category_df['location'] == location]
        counts = location_df['tag'].value_counts()
        location_counts[location] = counts
        all_tags.update(counts.index)
    # Create a unified index of all tags for the category
    unified_index = sorted(list(all_tags))
    for location in location_counts:
        # Reindex the counts to the unified index and fill missing values with 0
        location_counts[location] = location_counts[location].reindex(unified_index, fill_value=0)
    category_location_counts[category] = location_counts

# Set up the matplotlib figure and axes
fig, axes = plt.subplots(len(category_location_counts), 1, figsize=(12, 5 * len(category_location_counts)))

# Set colors for each location
colors = {'greenpark': 'green','sciencepark':'orange'}

# Width of each bar group and the space between bar groups
bar_width = 0.35

# Iterate over each category and its counts, and plot the bar charts
for i, (category, location_counts) in enumerate(category_location_counts.items()):
    unified_index = location_counts['greenpark'].index
    num_tags = len(unified_index)
    index = range(num_tags)
    offset = 0
    for location, counts in location_counts.items():
        # Create a new index for each location's bars within the group
        bar_index = [pos + offset for pos in index]
        axes[i].bar(bar_index, counts.values, width=bar_width, label=location, color=colors[location])
        offset += bar_width
    axes[i].set_title(f'{category} Tag Frequencies')
    axes[i].set_xlabel('Tag')
    axes[i].set_ylabel('Frequency')
    axes[i].set_xticks([pos + bar_width / 2 for pos in index])
    axes[i].set_xticklabels(unified_index)
    axes[i].tick_params(axis='x', rotation=90)
    axes[i].legend()

# Adjust the layout to prevent overlapping
plt.tight_layout()

# Set the font for better display of Chinese characters
plt.rcParams['font.sans-serif'] = ['WenQuanYi Zen Hei']
plt.rcParams['axes.unicode_minus'] = False

# Show the plots
plt.show()