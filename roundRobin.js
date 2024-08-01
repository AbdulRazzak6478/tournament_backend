const participants = [1, 2, 3, 4, 5, 6,7,8];
console.log('participant length : ',participants.length);

let totalRounds = 0;

let halfSize = 0;
if(participants.length %2 === 0){
    totalRounds = participants.length -1;
}else{
    totalRounds = participants.length;
}
halfSize = Math.floor(participants.length / 2);
console.log('total rounds : ',totalRounds);
console.log("HALF SIZE", halfSize);

let schedule = [];

// for odd
let players = [...participants];
for (let round = 0; round < totalRounds; round++) {
    let roundsArr = [];
    for (let match = 0; match < halfSize; match++) {
        let home = players[match];
        let away = players[players.length - 1 - match];
        roundsArr.push([home, away]);
    }
    schedule.push(roundsArr);
    if(participants.length % 2 == 0){
        let lastPlayer = players.pop();
        players.splice(1, 0, lastPlayer);
    }else{
        let lastEle = players.pop();
        players.unshift(lastEle);
    }
}


console.log("SCHEDULE", schedule);
