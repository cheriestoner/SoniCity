import pandas as pd
import matplotlib.pyplot as plt
import ast  # 用于安全解析字符串形式的列表

# 读取数据（假设数据文件为 recording_reason+tags.xlsx）
df = pd.read_csv("reasonntags.csv")

# 提取 greenpark 和 sciencepark 的标签数据
greenpark_tags = []
sciencepark_tags = []

for index, row in df.iterrows():
    if row['location'] == 'greenpark' and isinstance(row['tag'], str):
        tags = ast.literal_eval(row['tag'])  # 将字符串转换为列表
        greenpark_tags.extend(tags)
    elif row['location'] == 'sciencepark' and isinstance(row['tag'], str):
        tags = ast.literal_eval(row['tag'])
        sciencepark_tags.extend(tags)

# 统计词频
def count_freq(tags_list):
    freq = {}
    for tag in tags_list:
        freq[tag] = freq.get(tag, 0) + 1
    return pd.Series(freq).sort_values(ascending=False).head(10)

greenpark_freq = count_freq(greenpark_tags)
sciencepark_freq = count_freq(sciencepark_tags)

# 合并数据用于对比
combined_df = pd.DataFrame({
    'greenpark': greenpark_freq,
    'sciencepark': sciencepark_freq
}).fillna(0)

# 绘制柱状图
plt.figure(figsize=(12, 6))
x = range(len(combined_df))
width = 0.35

plt.bar([i - width/2 for i in x], combined_df['greenpark'], width=width, label='Greenpark', color='#4CAF50')
plt.bar([i + width/2 for i in x], combined_df['sciencepark'], width=width, label='Sciencepark', color='#2196F3')

plt.title('Top 10 Tags Frequency Comparison: Greenpark vs. Sciencepark', fontsize=14)
plt.xlabel('Tags', fontsize=12)
plt.ylabel('Frequency', fontsize=12)
plt.xticks(x, combined_df.index, rotation=45, ha='right')
plt.legend()
plt.tight_layout()
plt.show()