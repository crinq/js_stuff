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

class motor{
   constructor(){
      // config
      this.r = 1;
      this.ld = 0.0005;
      this.lq = 0.0005;
      this.psi = 0.05;
      this.polecount = 2;
      this.j = 0.000025;
      this.period = 1.0 / 5000.0;

      this.load = 0.0;
      this.damping = 0.1;
      this.friction = 0.1;

      // state
      this.id = 0.0;
      this.iq = 0.0;

      this.pos = 0.0;
      this.vel = 0.0;

      // derived state
      this.e_vel = 0.0;
      this.e_pos = 0.0;
      this.m_pos = 0.0;
      this.e_torque = 0.0;
      this.m_torque = 0.0;
      this.acc = 0.0;
      this.psi_d = 0.0;
      this.psi_q = 0.0;
      this.ind_d = 0.0;
      this.ind_q = 0.0;
   }

   pmsm(ud, uq){
      this.elec(ud, uq);

      this.e_torque = 3.0 / 2.0 * this.polecount * (this.psi * this.iq + (this.ld - this.lq) * this.id * this.iq);
      this.mech();
   }

   acim(ud, uq){
      this.elec(ud, uq);

      this.e_torque = 3.0 / 2.0 * this.polecount * this.psi_d * this.iq; // TODO check this
      this.mech();   
   }

   elec(ud, uq){
      this.psi_d = this.ld * this.id + this.psi;
      this.psi_q = this.lq * this.iq;
      
      this.ind_d = this.psi_q * this.e_vel;
      this.ind_q = this.psi_d * this.e_vel;
      
      this.id += (ud - this.r * this.id + this.ind_d) / this.ld * this.period;
      this.iq += (uq - this.r * this.iq - this.ind_q) / this.lq * this.period;
   }

   mech(){
      this.m_torque = this.e_torque - this.load - this.damping * this.vel - this.friction * Math.sign(this.vel);
      this.m_pos += this.vel * period;
      this.m_pos = (this.m_pos + Math.PI) % (2.0 * Math.PI) - Math.PI;
      this.e_pos = (this.m_pos * this.polecount + Math.PI) % (2.0 * Math.PI) - Math.PI;
      this.vel += this.acc * period;
      this.e_vel = this.vel * this.polecount;
      this.acc = this.m_torque / this.j;
   }
}

class pid{
   constructor(){
      // config
      this.p = 1.0;
      this.i = 1.0;
      this.ff0 = 0.0;
      this.ff1 = 0.0;
      this.period = 1.0 / 5000.0;
      this.max_output = 1.0;
      this.max_pi = 1.0;

      // state
      this.sum = 0.0;
      this.old_cmd = 0.0;

      // derived state
      this.cmd = 0.0;
      this.fb = 0.0;
      this.error = 0.0;
      this.sat = 0.0;
      this.max_sum = 0.0;
      this.min_sum = 0.0;
      this.output = 0.0;

   }

   run(cmd, fb){
      this.cmd = cmd;
      this.fb = fb;
      this.error = this.cmd - this.fb;


      this.sum += this.error * this.i * this.period; // i
      this.output = this.error * this.p; // p

      // p clamp
      if(this.output > this.max_output * this.max_pi){
         this.output = this.max_output * this.max_pi;
      }
      if(this.output < -this.max_output * this.max_pi){
         this.output = -this.max_output * this.max_pi;
      }

      // i clamp
      this.max_sum = this.max_output * this.max_pi - this.output;
      this.min_sum = -this.max_output * this.max_pi - this.output;

      if(this.sum > this.max_sum){
         this.sum = this.max_sum;
      }
      if(this.sum < this.min_sum){
         this.sum = this.min_sum;
      }

      this.output += this.sum;

      this.output += this.ff0 * this.cmd; // ff0
      this.output += this.ff1 * (this.cmd - this.old_cmd); // ff1

      // output clamp
      if(this.output > this.max_output){
         this.output = this.max_output;
      }

      if(this.output < -this.max_output){
         this.output = -this.max_output;
      }
   }
}