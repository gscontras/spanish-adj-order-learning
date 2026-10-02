# set working directory
setwd(dirname(rstudioapi::getActiveDocumentContext()$path))

# load packages
library(ggplot2)
library(lme4)
library(hydroGOF)
library(dplyr)
#library(tidyr)

# read data
df = read.csv("results.csv",header=T)
head(df)

d <- df

# only native Italian speakers
d = d[d$first_language!="Greg",]

# number of participants
length(unique(d$participant_id)) # n=61

# breakdown of data by condition
table(d$video_condition)
# subj trad 
# 988  598 


#####
## duplicate observations by first predicate
#####

library(tidyr)

o <- d
o$rightpredicate1 = o$predicate2
o$rightpredicate2 = o$predicate1
o$rightresponse = 1-o$response
agr = o %>% 
        select(predicate1,rightpredicate1,response,rightresponse,participant_id,noun,nounclass,class1,class2,video_condition) %>%
        gather(predicateposition,predicate,predicate1:rightpredicate1,-participant_id,-noun,-nounclass,-class1,-class2)
agr$correctresponse = agr$response
agr[agr$predicateposition == "rightpredicate1",]$correctresponse = agr[agr$predicateposition == "rightpredicate1",]$rightresponse
agr$correctclass = agr$class1
agr[agr$predicateposition == "rightpredicate1",]$correctclass = agr[agr$predicateposition == "rightpredicate1",]$class2
head(agr[agr$predicateposition == "rightpredicate1",])
agr$response = NULL
agr$rightresponse = NULL
agr$class1 = NULL
agr$class2 = NULL
nrow(agr) #3172
#write.csv(agr,"~/git/cross-linguistic_adjective_ordering/italian/experiments/2-order-preference-all-orders/results/naturalness-duplicated.csv")

# calculate mean distance by adjective and condition
adj_agr = aggregate(correctresponse~predicate*correctclass*video_condition,FUN=mean,data=agr)

# calculate mean distance by adjective class and condition
source("helpers.R")
class_agr = bootsSummary(data=agr , measurevar="correctresponse", groupvars=c("correctclass","video_condition"))

# preferred order from Scontras et al. 2017
level_order = c('size','quality','texture','age','shape','color','material')

# plot results by adjective class and condition
ggplot(data=class_agr,aes(x=factor(correctclass,level=level_order),y=correctresponse))+
  geom_bar(stat="identity",position=position_dodge(.9),color="black")+
  geom_hline(yintercept=0.5,linetype="dashed") + 
  geom_errorbar(aes(ymin=bootsci_low, ymax=bootsci_high, x=factor(correctclass,level=level_order), width=0.25),alpha=1,position=position_dodge(.9))+
  xlab("adjective class")+
  ylab("preference\nfor first position\n")+
  ylim(0,1)+
  facet_grid(.~video_condition)+
  #labs("order\npreference")+
  theme_bw()+
  theme(axis.text.x=element_text(angle=45,vjust=1,hjust=1))#+
#ggsave("class_distance.png",height=2.75,width=5.5)


# subjectivity analysis

# load subjectivity data from Scontras et al. 2017
s = read.csv("subjectivity-aggregate-from-OpenMind.csv",header=T)

# add subjectivity information to current results
adj_agr$subjectivity = s$response[match(adj_agr$predicate,s$predicate)]

# plot preferred distance against subjectivity
ggplot(adj_agr, aes(x=subjectivity,y=correctresponse)) +
  geom_point() +
  #geom_smooth()+
  stat_smooth(method="lm",color="black")+
  #geom_text(aes(label=predicate),size=2.5,vjust=1.5)+
  ylab("preference\nfor first position\n")+
  xlab("\nsubjectivity score")+
  ylim(0,1)+
  #xlim(0,1)+
  theme_bw() +
  facet_grid(.~video_condition)
#ggsave("../results/subjectivity-scatter.png",height=2.75,width=5.5)


# calculate correlations and bootstrap confidence intervals

# subj
subj = adj_agr[adj_agr$video_condition=="subj",]
gof(subj$correctresponse,subj$subjectivity)
# r = 0.93, r2 = 0.76
results <- boot(data=subj, statistic=rsq, R=10000, formula=correctresponse~subjectivity)
boot.ci(results, type="bca") 
# 95%   ( 0.7608,  0.9165 )  

# trad
trad = adj_agr[adj_agr$video_condition=="trad",]
gof(trad$correctresponse,trad$subjectivity)
# r = 0.89, r2 = 0.72
results <- boot(data=trad, statistic=rsq, R=10000, formula=correctresponse~subjectivity)
boot.ci(results, type="bca") 
# 95%   ( 0.5643,  0.9011 ) 



