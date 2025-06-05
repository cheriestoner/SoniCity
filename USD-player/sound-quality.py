import pandas as pd
import matplotlib.pyplot as plt

# Load the data
df = pd.read_csv('/mnt/questionnaire-7.csv')

print('数据基本信息：')
df.info()

# View the number of rows and columns in the data
rows, columns = df.shape

if rows < 100 and columns < 20:
    # Short - form data (行数少于100且列数少于20) view all data information
    print('数据全部内容信息：')
    print(df.to_csv(sep='\t', na_rep='nan'))
else:
    # Long - form data view data first few lines information
    print('数据前几行内容信息：')
    print(df.head().to_csv(sep='\t', na_rep='nan'))

# Question 9 & 11

# Calculate the mean and standard deviation for each column
mean_q9 = df['9、您如何评价我们刚刚参观过的公园的声音景观的整体质量？1=音质很差7=优秀的音质How do you rate the overall quality of the soundscape in the green park that we just visited? 1=bad sound quality 7=excellent sound quality—'].mean()
std_q9 = df['9、您如何评价我们刚刚参观过的公园的声音景观的整体质量？1=音质很差7=优秀的音质How do you rate the overall quality of the soundscape in the green park that we just visited? 1=bad sound quality 7=excellent sound quality—'].std()

mean_q11 = df['11、您如何评价我们刚刚参观的科技园区的声音景观的整体质量？1=音质很差7=优秀的音质How do you rate the overall quality of the soundscape in the science park that we just visited?1=bad sound quality 7=excellent sound quality—'].mean()
std_q11 = df['11、您如何评价我们刚刚参观的科技园区的声音景观的整体质量？1=音质很差7=优秀的音质How do you rate the overall quality of the soundscape in the science park that we just visited?1=bad sound quality 7=excellent sound quality—'].std()

# Set up the graph
labels = ['Question 9', 'Question 11']
means = [mean_q9, mean_q11]
stds = [std_q9, std_q11]
colors = ['blue', 'red']

# Set the font to display Chinese characters
plt.rcParams['font.sans-serif'] = ['WenQuanYi Zen Hei']
plt.rcParams['axes.unicode_minus'] = False

# Draw the error bar graph
plt.bar(labels, means, yerr=stds, capsize=5, color=colors)
plt.ylabel('Score')
plt.title('Error Bar Graph for Question 9 and Question 11')

plt.show()

# Question 10 & 12

# Calculate the mean and standard deviation for each column
mean_q10 = df['10、您在公园的录音，有什么深圳特色吗？1=没有特色，在任何城市能找到7=很有特色，只能在深圳找到或象征深圳Your recordings in the green park, how characteristic are they for Shenzhen?1=not characteristic, could be found in any other city7=very characteristic, can only be found in Shenzhen or symbolize Shenzhen—'].mean()
std_q10 = df['10、您在公园的录音，有什么深圳特色吗？1=没有特色，在任何城市能找到7=很有特色，只能在深圳找到或象征深圳Your recordings in the green park, how characteristic are they for Shenzhen?1=not characteristic, could be found in any other city7=very characteristic, can only be found in Shenzhen or symbolize Shenzhen—'].std()

mean_q12 = df['12、您在科技园区的录音，有什么深圳特色吗？1=没有特色，在任何城市能找到7=很有特色，只能在深圳找到或代表深圳Your recordings in the science park, how characteristic are they for Shenzhen?1=not characteristic, could be found in any other city7=very characteristic, can only be found in Shenzhen or symbolize Shenzhen—'].mean()
std_q12 = df['12、您在科技园区的录音，有什么深圳特色吗？1=没有特色，在任何城市能找到7=很有特色，只能在深圳找到或代表深圳Your recordings in the science park, how characteristic are they for Shenzhen?1=not characteristic, could be found in any other city7=very characteristic, can only be found in Shenzhen or symbolize Shenzhen—'].std()

# Set up the graph
labels = ['Question 10', 'Question 12']
means = [mean_q10, mean_q12]
stds = [std_q10, std_q12]
colors = ['blue', 'red']

# Set the font to display Chinese characters
plt.rcParams['font.sans-serif'] = ['WenQuanYi Zen Hei']
plt.rcParams['axes.unicode_minus'] = False

# Draw the error bar graph
plt.bar(labels, means, yerr=stds, capsize=5, color=colors)
plt.ylabel('Score')
plt.title('Error Bar Graph for Question 10 and Question 12')

plt.show()