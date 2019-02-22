import json
from pyemd import emd
import numpy as np
import multiprocessing as mp
import itertools

koColorNames = []
with open('temp/fullColorNames_ko.json', 'r') as color_names_f:
    koColorNames=json.loads(color_names_f.read())

enColorNames = []
with open('temp/fullColorNames_en.json', 'r') as color_names_f:
    enColorNames=json.loads(color_names_f.read())

distance_matrix = []
with open('temp/distanceMatrix.json', 'r') as distance_matrix_f:
    distance_matrix=np.array(json.loads(distance_matrix_f.read()))


pairs = list(itertools.product(koColorNames, enColorNames))

def job(ko_en_terms):
    koTerm = ko_en_terms[0]
    enTerm = ko_en_terms[1]
    print koTerm["term"], enTerm["term"]
    return {
      "koTerm": koTerm["term"],
      "enTerm": enTerm["term"],
      "dist": emd(np.array(koTerm["labPct"]),
                  np.array(enTerm["labPct"]),
                  distance_matrix)
    }
# core_num = mp.cpu_count() -> 8
pool = mp.Pool(processes=8)
emdDistances = pool.map(job, pairs)


with open("../translation_loss.json", "w") as text_file:
    text_file.write(json.dumps(emdDistances, indent = 2, ensure_ascii=False).encode('utf-8'))



