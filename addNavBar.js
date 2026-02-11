$( document ).ready(function() {
	let rootPath = "";
	let visPath = "";
	if(!window.location.pathname.includes("/vis/")){
		visPath = "vis/";
	} else{
		rootPath = "../";
	}
	
	let navBarStr = `

	<nav class="navbar navbar-expand-lg navbar-light bg-light ps-5">
	  <a class="navbar-brand" href="${rootPath}index.html">ManyLanguagesManyColors</a>
	  <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
	    <span class="navbar-toggler-icon"></span>
	  </button>

	  <div class="collapse navbar-collapse" id="navbarSupportedContent">
 	   <ul class="navbar-nav mr-auto">
	      <li class="nav-item active">
 	       <a class="nav-link" href="${rootPath}index.html">Home <span class="sr-only"></span></a>
	      </li>
	      <li class="nav-item">
	        <a class="nav-link" href="https://studies.labinthewild.org/color-perception/?REF=ManyLanguagesManyColors" target="_blank">Take the Survey</a>
	      </li>
	      <li class="nav-item dropdown">
	        <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
	         Visualizations
	        </a>
	        <ul class="dropdown-menu">
			  <li><a class="dropdown-item" href="${visPath}color-name-summaries.html">
			  		<img src="${visPath}imgs/color-name-summaries-tiny.png" style="max-height:20px; max-width:50px" />
			  		Color Name Summaries</a></li>
	          <li><a class="dropdown-item" href="${visPath}color_translator.html">
			  		<img src="${visPath}imgs/translator-tiny.png" style="max-height:20px; max-width:50px" /> 
					Color Translator</a></li>
	          <li><a class="dropdown-item" href="${visPath}stacked-spectrum.html">
			  		<img src="${visPath}imgs/hue-tiny.png" style="max-height:20px; max-width:50px" /> 
					Hue Color Comparisons</a></li>
	          <li><a class="dropdown-item" href="${visPath}full_color_maps.html">
			  		<img src="${visPath}imgs/full-color-tiny.png" style="max-height:20px; max-width:50px" /> 
					Full Color Comparisons</a></li>
	          <li><a class="dropdown-item" href="${visPath}en-ko-translation-comparison.html">
			  		<img src="${visPath}imgs/en-ko-translation-tiny.png" style="max-height:20px; max-width:50px" />
			  		Korean-English Translation Comparison</a></li>
	          <li><a class="dropdown-item" href="${visPath}viridis.html">
			  		<img src="${visPath}imgs/viridis-graph-tiny.png" style="max-height:20px; max-width:50px" />
			  		Korean-English Viridis Color Spectrum</a></li>
				<li><a class="dropdown-item" href="${visPath}full-color-bins-viewer.html">
			  		<img src="${visPath}imgs/full-color-bin-viewer-tiny.png" style="max-height:20px; max-width:50px" />
					Full Color Bin Options</a></li>
				<li><a class="dropdown-item" href="${visPath}cleaned_data_viewer.html">
			  		<img src="${visPath}imgs/cleaned-data-viewer-tiny.png" style="max-height:20px; max-width:50px" />
					Color Name Data Entries</a></li>
	        </ul>
	      </li>
	      <li class="nav-item">
	        <a class="nav-link" href="https://github.com/uwdata/color-naming-in-different-languages/">Dataset</a>
	      </li>
	    </ul>
	  </div>
	</nav>
	`
	
	$("body").prepend(navBarStr);
	
});
