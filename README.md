creation of Tournament 
- 

tasks
- updating a winner
- while updating winner check whether all matches are done , if yes then based on the length next round matches schedule
- updating winner in next match
- add team in tournament check all possibility


AddTeamInTournament
- check whether any one match declared a winner of round 1 , if yes then can't able to add team in tournament.
-  fetch tournament and format
- calculate no. of rounds matches possible 
- delete existing rounds and matches
- creating new rounds and matches based on update teams or participants length
- save save matches in rounds and rounds in format and tournament
- add referencing of one match to another match or to next round
- arrange teams or participants into round 1 matches
- handle for odd team as well

Options (?retryWrites=true&w=majority):

- retryWrites=true ensures that MongoDB drivers will retry write operations in case of network errors or other transient failures.
- w=majority specifies that write operations are considered successful if they have been written to a majority of the replica set members. This ensures data durability and consistency.

Transactions work on live url
- it might needs the queries option into URI (?retryWrites=true&w=majority)
- passing session into models queries
```
    //  if there is one character or object to create or multiple
    await Model.create([{ name : "abdul" }], { session : session });

     //  if there is for find query
    await Model.find({}).session(session);
    await Model.findOne({}).session(session);

Note : after commit Transactions there should be no abortTransactions
```