library(gaia)
library(data.table)

mpr = readRDS("./src/data/results_2/mpr-chr18p.rds")
ancestry = readRDS("./src/data/results_1/ancestry-chr18p.rds")
ancestry_thru_time = readRDS("./src/data/results_1/ancestry-thru-time-chr18p.rds")
flux = readRDS("./src/data/results_1/flux-chr18p.rds")
flux_thru_time = readRDS("./src/data/results_1/flux-thru-time-chr18p.rds")

geoarg = fread("./src/data/results_1/georef-arg.csv")
