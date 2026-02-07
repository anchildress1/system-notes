{
  requests: [
    .[] | {
      action: "updateObject",
      body: (
        . 
        | del(._highlightResult) 
        | del(._snippetResult) 
        | del(._rankingInfo) 
        | del(._distinctSeqID)
      )
    }
  ]
}
