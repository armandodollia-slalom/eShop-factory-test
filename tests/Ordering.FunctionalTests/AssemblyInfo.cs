// Each test class starts its own Aspire app host (Postgres + Identity); two at once clash, so run classes one after another.
[assembly: CollectionBehavior(DisableTestParallelization = true)]
