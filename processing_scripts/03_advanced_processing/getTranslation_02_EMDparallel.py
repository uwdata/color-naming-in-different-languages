import json
import os
import sys, traceback
from pyemd import emd
import numpy as np
import multiprocessing as mp
import itertools
import psutil
import signal
import time

print()
print("starting thread")
print()

def init_worker():
	signal.signal(signal.SIGINT, signal.SIG_IGN)

def job(lang1_lang2_terms):

	returnval = {}
	try:
		lang1 = lang1_lang2_terms[0]
		lang2 = lang1_lang2_terms[1]
		terms = lang1_lang2_terms[2]
		distance_matrices = lang1_lang2_terms[3]
		lang1Term = terms[0]
		lang2Term = terms[1]

		default_bin = '20'
		high_res_bin = '10'

		print(lang1Term[default_bin]["term"], lang2Term[default_bin]["term"])
		if(lang1 != lang2 or lang1Term[default_bin]["term"] < lang2Term[default_bin]["term"]):
			returnval[lang1+"term"] = lang1Term[default_bin]["term"]
			if(lang1 == lang2):
				returnval[lang2+"term2"] =lang2Term[default_bin]["term"]
			else:
				returnval[lang2+"term"] =lang2Term[default_bin]["term"]
			
			# Do default size 20 bin check
			returnval["dist"] = emd(np.array(lang1Term[default_bin]["labPct"]),
						  np.array(lang2Term[default_bin]["labPct"]),
						  distance_matrices[default_bin])
			
			# if low distance and we have high res bin data, calculate more accurate
			if(returnval["dist"] < 60 
	  				and high_res_bin in lang1Term and high_res_bin in lang2Term):
				print("  --- dist small enough ("+str(returnval["dist"])+"), and data available for highres bin")
				returnval["dist"] = emd(np.array(lang1Term[high_res_bin]["labPct"]),
						  np.array(lang2Term[high_res_bin]["labPct"]),
						  distance_matrices[high_res_bin])
			elif(returnval["dist"] == 0):
				print("Unexpected error: distance was 0 and high res not available for " +
		  				lang1Term[default_bin]["term"], lang2Term[default_bin]["term"])
				raise Exception("Unexpected error: distance was 0 and high res not available")
			

	except Exception as err:
		print("error from thread" + mp.current_process().name)
		print("Unexpected error:", sys.exc_info()[0])
		print('-'*60)
		traceback.print_exc(file=sys.stdout)
		print('-'*60)
		p = psutil.Process(os.getppid())
		p.send_signal(signal.CTRL_C_EVENT)

		raise err
	return returnval

def main():
	try:
		print()
		print("************************")
		print()
		print("NOTE: This is very slow!")
		print()
		print("To recalculate all translations, ",
			"delete all files in the translation_loss directory, ",
			"then when this program runs, it will skip files already created")
		print()

		pool = mp.Pool(processes=4, initializer=init_worker)


		#make sure target folder exists
		if(not os.path.isdir("../../model/translation_loss")):
			os.mkdir("../../model/translation_loss")

		# get languages (based on what is in the temp directory)
		fnames = os.listdir("temp")
		languages = []
		for fname in fnames:
			if(fname.startswith("fullColorNames_")):
				lang = fname.replace("fullColorNames_", "").replace(".json", "").split("_")[0]
				if(lang not in languages):
					languages.append(lang)

		print(languages)

		ColorNames = {}

		for lang in languages:
			print("loading language" + lang)
			ColorNames[lang] = []
			colorNamesWithBins = {}
			for bin_size in ['10', '20']:
				fname = 'temp/fullColorNames_'+lang+'_'+bin_size+'.json'
				if(os.path.isfile(fname)):
					binColorNames = []
					with open(fname, 'r', encoding="utf-8") as color_names_f:
						binColorNames=json.loads(color_names_f.read())

					for colorInfo in binColorNames:
						if(colorInfo["term"] not in colorNamesWithBins):
							colorNamesWithBins[colorInfo["term"]] = {}
						colorNamesWithBins[colorInfo["term"]][bin_size] = colorInfo
			for term, binnedInfo in colorNamesWithBins.items():
				ColorNames[lang].append(binnedInfo)


		print("loading distance matrix")
		distance_matrices = {}
		for bin_size in ['10', '20']:
			with open('temp/distanceMatrix_'+bin_size+'.json', 'r') as distance_matrix_f:
				distance_matrices[bin_size]=np.array(json.loads(distance_matrix_f.read()))


		print("starting jobs")
		for lang1 in languages:
			for lang2 in languages:
				if(lang2 < lang1):
					continue



				if(os.path.isfile("../../model/translation_loss/translation_loss_"+lang1+"_"+lang2+".json")):
					print("Translation file: "+lang1+"_"+lang2+" already exists, skipping...")
					continue

				print("computing translations " + lang1 + "_" + lang2)

				pairs = list(itertools.product(ColorNames[lang1], ColorNames[lang2]))
				pairs = list(map(lambda x: [lang1, lang2, x, distance_matrices], pairs))

				emdDistances_async = pool.map_async(job, pairs)
				# use async map and sleep to be ready to hear interrupts
				while not emdDistances_async.ready():
					time.sleep(1)

				emdDistances = emdDistances_async.get()


				# filter out empty entries (no need to calculate distance for the pair, such as a word and itself)
				emdDistances = [x for x in emdDistances if 'dist' in x]

				with open("../../model/translation_loss/translation_loss_"+lang1+"_"+lang2+".json", "wb") as text_file:
					text_file.write(json.dumps(emdDistances, indent = 2, ensure_ascii=False).encode('utf-8'))
	except Exception as err:
		pool.terminate()
		raise err

if __name__ == '__main__':
	# freeze_support() here if program needs to be frozen
	print("starting")
	main()