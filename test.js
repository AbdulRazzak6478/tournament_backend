     //   if (nextMatchDetails?.teamA) {
      //     if (
      //       nextMatchDetails?.teamA?.toString() ===
      //         updatedMatch?.winner?.toString() ||
      //       nextMatchDetails?.teamA?.toString() ===
      //         updatedMatch?.teamA?.toString() ||
      //       nextMatchDetails?.teamA?.toString() ===
      //         updatedMatch?.teamB?.toString()
      //     ) {
      //       nextMatchDetails.teamA = updatedMatch?.winner?.toString();
      //     } else if (nextMatchDetails?.teamB) {
      //       if (
      //         nextMatchDetails?.teamB?.toString() ===
      //           updatedMatch?.winner?.toString() ||
      //         nextMatchDetails?.teamB?.toString() ===
      //           updatedMatch?.teamA?.toString() ||
      //         nextMatchDetails?.teamB?.toString() ===
      //           updatedMatch?.teamB?.toString()
      //       ) {
      //         nextMatchDetails.teamB = updatedMatch?.winner?.toString();
      //       }
      //     } else {
      //       nextMatchDetails.teamB = updatedMatch?.winner?.toString();
      //     }
      //   } else if (!nextMatchDetails?.teamA) {
      //     if (nextMatchDetails?.teamB) {
      //       if (
      //         nextMatchDetails?.teamB?.toString() ===
      //           updatedMatch?.winner?.toString() ||
      //         nextMatchDetails?.teamB?.toString() ===
      //           updatedMatch?.teamA?.toString() ||
      //         nextMatchDetails?.teamB?.toString() ===
      //           updatedMatch?.teamB?.toString()
      //       ) {
      //         nextMatchDetails.teamB = updatedMatch?.winner?.toString();
      //       } else {
      //         nextMatchDetails.teamA = updatedMatch?.winner?.toString();
      //       }
      //     } else {
      //       nextMatchDetails.teamA = updatedMatch?.winner?.toString();
      //     }
      //   }

      let test = null;
      console.log('check : ',test?.toString(), typeof test?.toString());