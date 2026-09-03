
let families=[
{name:"Golden Phoenix",points:2450},
{name:"Royal Titans",points:2200},
{name:"Crimson Dragons",points:1850},
{name:"Maroon Lions",points:1600}
];

families.sort((a,b)=>b.points-a.points);

document.getElementById("champion").innerHTML=
`<h1>👑 ${families[0].name}</h1>
<h2>${families[0].points} POINTS</h2>`;

document.getElementById("points").innerHTML=
families.reduce((x,y)=>x+y.points,0);

document.getElementById("ranking").innerHTML=
families.map((f,i)=>`
<div class="rank">
<span>#${i+1} ${f.name}</span>
<b>${f.points} pts</b>
</div>`).join("");
