# Will run this file after data collection is done

from os import listdir
from os.path import isfile, join

onlyfiles = [f for f in listdir('./tweets/') if isfile(join('./tweets/', f))]

for file in onlyfiles:
    with open(join('./tweets/', file), "r+") as f:
        lines_seen = set() # holds lines already seen
        d = f.readlines()
        f.seek(0)
        for i in d:
            if i not in lines_seen:
                f.write(i)
                lines_seen.add(i)
        f.truncate()
