
import json
import pandas as pd

tag_dict = {
    'source-type': ['music', 'traffic', 'birds', 'voice'],
    'temporal': ['loud', 'medium-loud', 'soft', 'getting-louder', 'varying-over-time', 'getting-softer', 'continuous'],
    'quality': ['clear', 'noisy', 'chaotic', 'harmonous', 'controlled', 'dynamic', 'static', 'moving', 'melodic', 'rhythmic'], 
    'context': ['isolated', 'standing-out', 'blended', 'masked', 'disappearing'], 
    'pleasantness': ['beautiful', 'nice', 'uninteresting', 'boring', 'annoying', 'no-emotion']
}

tags_list = []
tags_df = pd.DataFrame(columns=['user', 'location', 'sound_id', 'tag'])

folder_locations = ['greenpark', 'sciencepark']
for location in folder_locations:
    for i in range(1, 8):
        for j in range(1, 5):
            folder_chlid = f'archive/recording/{location}/user{i}/slot-{j}'
            json_file = f'{folder_chlid}/metadata.json'
            try:
                with open(json_file, 'r') as file:
                    data = json.load(file)
                for key, value in data.items():
                    if key == 'tags':
                        print(value)
                        tags_list.append([f'user{i}', location, j, value])
                        # tags_df = tags_df.append({'user': f'user{i}', 'location': location, 'sound_id': j, 'tag': value}, ignore_index=True)
            except:
                print(f'{json_file} does not exist')
tags_df = pd.DataFrame(tags_list, columns=['user', 'location', 'sound_id', 'tag'])
tags_df.to_csv('tags.csv', index=False)