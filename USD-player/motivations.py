import matplotlib.pyplot as plt
from ast import literal_eval
import pandas as pd

# Load the dataset
df = pd.read_csv('/mnt/reason_tags.csv')

print('数据基本信息：')
df.info()

# 查看数据集行数和列数
rows, columns = df.shape

if rows < 100 and columns < 20:
    # 短表数据（行数少于100且列数少于20）查看全量数据信息
    print('数据全部内容信息：')
    print(df.to_csv(sep='\t', na_rep='nan'))
else:
    # 长表数据查看数据前几行信息
    print('数据前几行内容信息：')
    print(df.head().to_csv(sep='\t', na_rep='nan'))

# Manually define a mapping of long sentences to short labels
short_label_mapping = {
    'The sound was loud/prominent.': 'Loud',
    'The sound was pleasant/enjoyable.': 'Pleasant',
    'The sound was typical of this place.': 'Typical',
    'The sound was unique/uncommon.': 'Unique',
    'The sound was quiet/subtle but meaningful.': 'Quiet & Meaningful',
    'The sound was annoying/disturbing.': 'Annoying',
    'Other (please specify): Sounds that can be found there over a longer period of time': 'Long - term Sounds',
}

# Filter out greenpark and sciencepark data, and handle NaN values
filtered_df = df[df['location'].isin(['greenpark', 'sciencepark'])].dropna(subset=['Survey Question 1: What influenced your choice of the four recorded sounds in each location?'])

# Parse the string representation of lists into actual lists
filtered_df['Survey Question 1: What influenced your choice of the four recorded sounds in each location?'] = filtered_df[
    'Survey Question 1: What influenced your choice of the four recorded sounds in each location?'
].apply(literal_eval)

# Expand the lists in the column into separate rows
expanded_df = filtered_df.explode('Survey Question 1: What influenced your choice of the four recorded sounds in each location?')

# Group by location and influencing factor, and count the number of occurrences
grouped_df = expanded_df.groupby(['location', 'Survey Question 1: What influenced your choice of the four recorded sounds in each location?'])[
    'Survey Question 1: What influenced your choice of the four recorded sounds in each location?'
].count().unstack(fill_value=0).T

# Replace the long sentences with short labels in the grouped_df index
grouped_df = grouped_df.rename(index=short_label_mapping)

# Prepare data for the bar chart
greenpark_data = grouped_df.loc[:, 'greenpark']
sciencepark_data = grouped_df.loc[:, 'sciencepark']

# Set the font for Chinese characters
plt.rcParams['font.sans-serif'] = ['WenQuanYi Zen Hei']

# Set the size of the bar chart
plt.figure(figsize=(12, 8))

# Set the width of the bars
bar_width = 0.35

# Set the positions of the bars on the x - axis
index = range(len(greenpark_data.index))

# Draw the bars for greenpark
plt.bar(index, greenpark_data, bar_width, label='greenpark')

# Draw the bars for sciencepark
plt.bar([i + bar_width for i in index], sciencepark_data, bar_width, label='sciencepark')

# Set the x - axis labels, y - axis label, and title
plt.xticks([i + bar_width/2 for i in index], greenpark_data.index, rotation=45)
plt.ylabel('Number of Occurrences')
plt.title('Comparison of Influencing Factors between greenpark and sciencepark')

# Add a legend
plt.legend()

# Add a new legend at the bottom for the short label mapping
handles = []
labels = []
for long_label, short_label in short_label_mapping.items():
    handles.append(plt.Rectangle((0, 0), 1, 1, fc='w', fill=False, edgecolor='none', linewidth=0))
    labels.append(f'{short_label}: {long_label}')

plt.figlegend(handles, labels, loc='lower center', ncol=2, fontsize=8)

# Adjust the layout to make room for the new legend
plt.subplots_adjust(bottom=0.3)

# Display the bar chart
plt.show()