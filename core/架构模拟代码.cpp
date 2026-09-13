#include <bits/stdc++.h>

#define NumOfBlock 10
#define NumOfShort 14*NumOfBlock

class block{
public:
  unsigned short a[14];//14个16位内存
  unsigned short digit;//显示结果
  bool death;//是否显示过了结果
  //控制读取/写入的内存位置，例如 (低位)10111111111111(高位) 就是 a[1]
  unsigned short lock;
  //进度条显示和控制lock，例如 (低位)11100000000000(高位) 就是已读 3 位
  unsigned short step;
  block*next=NULL;
  void init(){
    death=0;
    step=0;
    lock=0;
    for(auto&t:a)t=2000;
    lock=(1<<14)-1;
    if(next!=NULL)next->init();
  }
  void init_step(){
    if(death==0)step=0;//清空进度条&
    if(next!=NULL)next->init_step();
  }
  void print(unsigned short v){
    if(death==1)next->print(v);
    else{
      digit=v,death=1;
      printf("%04d",v);//test
    }
  }
  unsigned short que(){
    if(step&(1<<13))return next->que();
    else{
      (lock<<=1)|=(step&1);
//      std::cout<<std::bitset<14>(lock)<<"\n";
      return a[__builtin_ctz(~lock)];
    }
  }
  void mdf(unsigned short v){
    if(step&(1<<13))next->mdf(v);
    else{
      (step<<=1)|=1;//进度条增加一位进度
//      std::cout<<"\t"<<std::bitset<14>(step)<<"\n";
      a[__builtin_ctz(~lock)]=v;
    }
  }
}a[NumOfBlock];

class ALU{
public:
  void init(){
    a[0].init();
  }
  void cal(){
    unsigned int i=NumOfShort,items=NumOfShort,d=0,e=0;
    while(items!=0){
//      std::cout<<items<<"\n";
      i=items;
      while(i!=0){
//        std::cout<<i<<":\t";
        auto q=a[0].que();
        auto T=d*i+q*10000;
        auto v=2*i-1;
        a[0].mdf(T%v);d=T/v;
//        std::cout<<q<<"->"<<T%v<<"\n";
        i--;
      }
      a[0].print(e+d/10000);
      a[0].init_step();
      d=e=d%10000;
      items-=14;
    }
  }
}c;

int main(){
  //连接模块
  for(int i=1;i<NumOfBlock;i++)a[i-1].next=&a[i];
  //初始化
  c.init();
  //计算
  c.cal();
  return 0;
}
