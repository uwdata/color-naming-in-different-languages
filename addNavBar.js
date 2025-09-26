$( document ).ready(function() {
	let rootPath = "";
	let visPath = "";
	if(!window.location.pathname.includes("/vis/")){
		visPath = "vis/";
	} else{
		rootPath = "../";
	}
	
	let navBarStr = "";

	navBarStr += '<nav class="navbar navbar-expand-lg navbar-light bg-light ps-5">';
	navBarStr += '  <a class="navbar-brand" href="'+rootPath+'index.html">ManyLanguagesManyColors</a>';
	navBarStr += '  <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">';
	navBarStr += '    <span class="navbar-toggler-icon"></span>';
	navBarStr += '  </button>';

	navBarStr += '  <div class="collapse navbar-collapse" id="navbarSupportedContent">';
 	navBarStr += '   <ul class="navbar-nav mr-auto">';
	navBarStr += '      <li class="nav-item active">';
 	navBarStr += '       <a class="nav-link" href="'+rootPath+'index.html">Home <span class="sr-only"></span></a>';
	navBarStr += '      </li>';
	navBarStr += '      <li class="nav-item">';
	navBarStr += '        <a class="nav-link" href="http://labinthewild.org/studies/color_perception/" target="_blank">Take the Survey</a>';
	navBarStr += '      </li>';
	navBarStr += '      <li class="nav-item dropdown">';
	navBarStr += '        <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">';
	navBarStr += '         Visualizations';
	navBarStr += '        </a>';
	navBarStr += '        <ul class="dropdown-menu">';
	navBarStr += '          <li><a class="dropdown-item" href="'+visPath+'color_translator.html">Color Translator</a></li>';
	navBarStr += '          <li><a class="dropdown-item" href="'+visPath+'stacked-spectrum.html">Hue Color Comparisons</a></li>';
	navBarStr += '          <li><a class="dropdown-item" href="'+visPath+'full_color_maps.html">Full Color Maps</a></li>';
	navBarStr += '          <li><a class="dropdown-item" href="'+visPath+'en-ko-translation-comparison.html">Korean-English Translation Comparison</a></li>';
	navBarStr += '          <li><a class="dropdown-item" href="'+visPath+'viridis.html">Korean-English Viridis Color Spectrum</a></li>';
	navBarStr += '        </ul>';
	navBarStr += '      </li>';
	navBarStr += '      <li class="nav-item">';
	navBarStr += '        <a class="nav-link" href="https://github.com/uwdata/color-naming-in-different-languages/">Dataset</a>';
	navBarStr += '      </li>';
	navBarStr += '    </ul>';
	navBarStr += '  </div>';
	navBarStr += '</nav>';
	
	$("body").prepend(navBarStr);
	
});
