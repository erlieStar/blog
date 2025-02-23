(window.webpackJsonp=window.webpackJsonp||[]).push([[114],{511:function(s,t,a){"use strict";a.r(t);var e=a(56),n=Object(e.a)({},(function(){var s=this,t=s.$createElement,a=s._self._c||t;return a("ContentSlotsDistributor",{attrs:{"slot-key":s.$parent.slotKey}},[a("h1",{attrs:{id:"面试官-一张千万级别数据的表想做分页-如何优化"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#面试官-一张千万级别数据的表想做分页-如何优化"}},[s._v("#")]),s._v(" 面试官：一张千万级别数据的表想做分页，如何优化？")]),s._v(" "),a("p",[a("img",{attrs:{src:"https://img-blog.csdnimg.cn/20200805125640128.jpg?",alt:"在这里插入图片描述"}})]),s._v(" "),a("h2",{attrs:{id:"介绍"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#介绍"}},[s._v("#")]),s._v(" 介绍")]),s._v(" "),a("p",[s._v("当进行分页时，MySQL 并不是跳过 offset 行，而是取 offset+N 行，然后放弃前 offset 行，返回 N 行。例如 limit 10000, 20。mysql排序取出10020条数据后，仅返回20条数据，查询和排序的代价都很高。那当 offset 特别大的时候，效率就非常的低下，所以我们要对sql进行改写")]),s._v(" "),a("h2",{attrs:{id:"使用书签"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#使用书签"}},[s._v("#")]),s._v(" 使用书签")]),s._v(" "),a("p",[s._v("用书签记录上次取数据的位置，过滤掉部分数据")]),s._v(" "),a("p",[s._v("如下面语句")]),s._v(" "),a("div",{staticClass:"language-sql extra-class"},[a("pre",{pre:!0,attrs:{class:"language-sql"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("SELECT")]),s._v(" id"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" name"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" description "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("FROM")]),s._v(" film "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("ORDER")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("BY")]),s._v(" name "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("LIMIT")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("1000")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("10")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n")])])]),a("p",[s._v("可以改为")]),s._v(" "),a("div",{staticClass:"language-sql extra-class"},[a("pre",{pre:!0,attrs:{class:"language-sql"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("SELECT")]),s._v(" id"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" name"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" description "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("FROM")]),s._v(" film "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("WHERE")]),s._v(" name "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v(">")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[s._v("'begin'")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("ORDER")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("BY")]),s._v(" name "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("LIMIT")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("10")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n")])])]),a("p",[s._v("name为上次分页后的最大值，注意这种场景只适用于不存在重复值的场景。")]),s._v(" "),a("h2",{attrs:{id:"延迟关联"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#延迟关联"}},[s._v("#")]),s._v(" 延迟关联")]),s._v(" "),a("p",[s._v("延迟关联：通过使用覆盖索引查询返回需要的主键，再根据主键关联原表获得需要的数据")]),s._v(" "),a("div",{staticClass:"language-sql extra-class"},[a("pre",{pre:!0,attrs:{class:"language-sql"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("SELECT")]),s._v(" id"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" name"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" description "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("FROM")]),s._v(" film "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("ORDER")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("BY")]),s._v(" name "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("LIMIT")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("100")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("5")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n")])])]),a("p",[s._v("id是主键值，name上面有索引。这样每次查询的时候，会先从name索引列上找到id值，然后回表，查询到所有的数据。可以看到有很多回表其实是没有必要的。完全可以先从name索引上找到id（注意只查询id是不会回表的，因为非聚集索引上包含的值为索引列值和主键值，相当于从索引上能拿到所有的列值，就没必要再回表了），然后再关联一次表，获取所有的数据")]),s._v(" "),a("p",[s._v("因此可以改为")]),s._v(" "),a("div",{staticClass:"language-sql extra-class"},[a("pre",{pre:!0,attrs:{class:"language-sql"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("SELECT")]),s._v(" film"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("id"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" name"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" description "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("FROM")]),s._v(" film \n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("JOIN")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("SELECT")]),s._v(" id "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("from")]),s._v(" film "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("ORDER")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("BY")]),s._v(" name "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("LIMIT")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("100")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("5")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("temp")]),s._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("ON")]),s._v(" film"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("id "),a("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("temp")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("id\n")])])]),a("h2",{attrs:{id:"倒序查询"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#倒序查询"}},[s._v("#")]),s._v(" 倒序查询")]),s._v(" "),a("p",[s._v("假如查询倒数最后一页，offset可能回非常大")]),s._v(" "),a("div",{staticClass:"language-sql extra-class"},[a("pre",{pre:!0,attrs:{class:"language-sql"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("SELECT")]),s._v(" id"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" name"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" description "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("FROM")]),s._v(" film "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("ORDER")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("BY")]),s._v(" name "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("LIMIT")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("100000")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("10")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n")])])]),a("p",[s._v("改成倒序分页，效率是不是快多了？")]),s._v(" "),a("div",{staticClass:"language-sql extra-class"},[a("pre",{pre:!0,attrs:{class:"language-sql"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("SELECT")]),s._v(" id"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" name"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v(" description "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("FROM")]),s._v(" film "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("ORDER")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("BY")]),s._v(" name "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("DESC")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("LIMIT")]),s._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[s._v("10")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(";")]),s._v("\n")])])])])}),[],!1,null,null,null);t.default=n.exports}}]);