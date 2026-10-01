import pandas as pd
import json


def convert_json_to_df(participant_data):

    # Convert trials into a DataFrame
    df = pd.DataFrame(participant_data['trials'])

    # Add subject information to every trial
    for key, value in participant_data.get('subject_information', {}).items():
        df[key] = value

    # Add system information to every trial
    for key, value in participant_data.get('system', {}).items():
        df[key] = value

    # Add other participant-level information
    df['video_condition'] = participant_data.get('video_condition')
    df['age_group'] = participant_data.get('age_group')
    df['consent'] = participant_data.get('consent')
    df['guardian_name'] = participant_data.get('guardian_name')
    df['time_in_minutes'] = participant_data.get('time_in_minutes')

    return df


# Load JSON data
with open('new_map_data.json') as json_file:

    # The experiment saves a series of JSON objects separated by commas,
    # rather than a single JSON array.
    json_file_string = '[' + json_file.read().rstrip(',\n') + ']'

    json_trials = json.loads(json_file_string)


# Convert all participants
participant_dfs = []

for participant_id, participant_data in enumerate(json_trials, start=1):

    df = convert_json_to_df(participant_data)

    # Add participant ID to every trial
    df['participant_id'] = participant_id

    participant_dfs.append(df)


# Combine all participants
df_trials = pd.concat(participant_dfs, ignore_index=True, sort=False)


# Save CSV
df_trials.to_csv('results.csv', index=False)