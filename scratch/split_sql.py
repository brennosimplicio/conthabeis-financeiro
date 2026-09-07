import os

def split_file():
    with open('scratch/migrate_data.sql', 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    chunk_size = 400
    for i in range(0, len(lines), chunk_size):
        chunk = lines[i:i+chunk_size]
        with open(f'scratch/part{i//chunk_size + 1}.sql', 'w', encoding='utf-8') as f:
            f.write("".join(chunk))

if __name__ == '__main__':
    split_file()
