function $(element) {
  return(document.getElementById(element));
}

function print(text){
   document.body.innerHTML += text + "\n";
}

class slider{
   constructor(id, min, max){
      this.id = id;
      this.min = min;
      this.max = max;
      
      print("<input type = 'range' id = '" + id + "_slider' min = '0' max = '1' step = '0.01' value = '0'>");
   }
   
   get value(){
      return($(this.id + "_slider").value * (this.max - this.min) + this.min);
   }
}

class button{
   constructor(id, text, callback){
      this.id = id;
      this.text = text;
      this.callback = callback;
      
      print("<input type = 'button' id = '" + id + "_button' value = '" + this.text + "' onclick = '" + callback + "();'>");
   }
   
   get value(){
      return($(this.id + "_slider").value * (this.max - this.min) + this.min);
   }
}

class text{
   constructor(id, value){
      this.id = id;

      print("<div id = '" + this.id + "_text' ></div>");

      this.value = value;
   }
   
   set value(v){
      $(this.id + "_text").innerHTML = v;
   }
   
   get value(){
      return($(this.id + "_text").innerHTML);
   }
}

class plot{
   constructor(id, width, height, x_min, x_max, y_min, y_max){
      this.id = id;
      this.width = width;
      this.height = height;
      this.x_min = x_min;
      this.x_max = x_max;
      this.y_min = y_min;
      this.y_max = y_max;
      
      print("<canvas id = '" + id + "_canvas' width = '" + width + "'' height='" + height + "'>not supported</canvas>");
   }
   
   plot(x, y, color){
      if(x < this.x_min || x > this.x_max || y < this.y_min || y > this.y_max){
         return;
      }
      
      x = (x - this.x_min) / (this.x_max - this.x_min) * this.width;
      y = this.height - (y - this.y_min) / (this.y_max - this.y_min) * this.height;
      
      
      var canvas = $(this.id + "_canvas");
      var ctx = canvas.getContext('2d');
      
      if(ctx){
         ctx.beginPath();
         ctx.strokeStyle=color;
         ctx.moveTo(x, y);
         ctx.arc(x, y, 0.5, 0, 2 * Math.PI);
         ctx.stroke();
         ctx.closePath();
      }
   }
}
