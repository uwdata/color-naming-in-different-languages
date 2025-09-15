import json
import os
import sys, traceback
from pyemd import emd
import numpy as np
import multiprocessing as mp
import itertools

print()
print("************************")
print()
print("NOTE: This is very slow!")
print()
print("To recalculate all translations, ",
      "delete all files in the translation_loss directory, ",
      "then when this program runs, it will skip files already created")
print()

def job(lang1_lang2_terms):
	returnval = {}
	try:
		lang1 = lang1_lang2_terms[0]
		lang2 = lang1_lang2_terms[1]
		terms = lang1_lang2_terms[2]
		distance_matrix = lang1_lang2_terms[3]
		lang1Term = terms[0]
		lang2Term = terms[1]
		print(lang1Term["term"].encode("utf-8"), lang2Term["term"].encode("utf-8"))
		if(lang1 != lang2 or lang1Term["term"] < lang2Term["term"]):
			returnval[lang1+"term"] = lang1Term["term"]
			if(lang1 == lang2):
				returnval[lang2+"term2"] =lang2Term["term"]
			else:
				returnval[lang2+"term"] =lang2Term["term"]
			returnval["dist"] = emd(np.array(lang1Term["labPct"]),
						  np.array(lang2Term["labPct"]),
						  distance_matrix)
	except:
		print("Unexpected error:", sys.exc_info()[0])
		print('-'*60)
		traceback.print_exc(file=sys.stdout)
		print('-'*60)
		raise
	return returnval

def main():
	# get languages (based on what is in the temp directory)
	fnames = os.listdir("temp")
	languages = []
	for fname in fnames:
		if(fname.startswith("fullColorNames_")):
			lang = fname.replace("fullColorNames_", "").replace(".json", "")
			languages.append(lang)

	print(languages)

	ColorNames = {}

	for lang in languages:
		print("loading language" + lang)
		ColorNames[lang] = []
		with open('temp/fullColorNames_'+lang+'.json', 'r', encoding="utf-8") as color_names_f:
			ColorNames[lang]=json.loads(color_names_f.read())


	print("loading distance matrix")
	distance_matrix = []
	with open('temp/distanceMatrix.json', 'r') as distance_matrix_f:
		distance_matrix=np.array(json.loads(distance_matrix_f.read()))


	print("starting jobs")
	pool = mp.Pool(processes=4)
	for lang1 in languages:
		for lang2 in languages:
			if(lang2 < lang1):
				continue
			#lang1 = sys.argv[1]
			#lang2 = sys.argv[2]

			if(os.path.isfile("../translation_loss/translation_loss_"+lang1+"_"+lang2+".json")):
				print("Translation file: "+lang1+"_"+lang2+" already exists, skipping...")
				continue

			print("computing translations " + lang1 + "_" + lang2)

			pairs = list(itertools.product(ColorNames[lang1], ColorNames[lang2]))
			pairs = list(map(lambda x: [lang1, lang2, x, distance_matrix], pairs))

			# core_num = mp.cpu_count() -> 8
			emdDistances = pool.map(job, pairs)


			with open("../translation_loss/translation_loss_"+lang1+"_"+lang2+".json", "wb") as text_file:
				text_file.write(json.dumps(emdDistances, indent = 2, ensure_ascii=False).encode('utf-8'))


if __name__ == '__main__':
	# freeze_support() here if program needs to be frozen
	print("starting")
	main()