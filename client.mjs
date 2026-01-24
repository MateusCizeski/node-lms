const base = "http://localhost:3000";

setTimeout(async () => {
  const response1 = await fetch(base + "/curso/python");
  console.log(response1.ok, response1.status);
  const reponse2 = await fetch(base + "/");
  console.log(reponse2.ok, reponse2.status);
}, 200);
